import { ChangeDetectionStrategy, Component, signal, computed, inject, effect, untracked, OnDestroy, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { WorkflowNode, PaletteNode, Workflow, WorkflowEdge, NodeType } from '../../../../types';
import { WorkflowService } from '../../../../services/workflow.service';
import { CampaignService } from '../../../../services/campaign.service';
import { SegmentService } from '../../../../services/segment.service';
import { WorkflowNodeComponent } from '../builder/workflow-node/workflow-node.component';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

const NODE_WIDTH = 320; // Corresponds to Tailwind's w-80 class
const NODE_HEIGHT = 72; // Approximate height of a node card
const VERTICAL_GAP = 80; // Vertical spacing between nodes
const HORIZONTAL_GAP = 40; // Horizontal spacing for branches

/**
 * The main component for creating and editing automation workflows.
 * It provides a drag-and-drop interface with a canvas, a node palette,
 * and a settings panel for configuring individual workflow nodes.
 * It also supports undo/redo functionality.
 */
@Component({
  selector: 'app-workflow-builder',
  imports: [CommonModule, ReactiveFormsModule, WorkflowNodeComponent],
  templateUrl: './workflow-builder.component.html',
  styleUrls: ['./workflow-builder.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowBuilderComponent implements OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private workflowService = inject(WorkflowService);
  private campaignService = inject(CampaignService);
  private segmentService = inject(SegmentService);

  /** The current state of the workflow being built. */
  readonly workflow = signal<Workflow | undefined>(undefined);
  /** The catalog of available nodes that can be dragged onto the canvas. */
  readonly paletteNodes = signal<PaletteNode[]>([]);
  /** The ID of the currently selected node on the canvas. */
  readonly selectedNodeId = signal<string | null>(null);
  /** The search term for filtering the node palette. */
  readonly paletteSearchTerm = signal('');

  // Drag & Drop State
  /** The node being dragged from the palette. */
  readonly draggedPaletteNode = signal<PaletteNode | null>(null);
  /** The node being dragged on the canvas, including its initial mouse offset. */
  readonly draggedCanvasNode = signal<{ id: string; offsetX: number; offsetY: number } | null>(null);
  /** The drop zone that is currently active (being hovered over). */
  readonly activeDropZone = signal<{ parentId: string, label?: 'YES' | 'NO' } | null>(null);

  // Settings Panel State
  /** The active tab in the settings panel ('settings' or 'advanced'). */
  readonly settingsTab = signal<'settings' | 'advanced'>('settings');
  /** The reactive form for the selected node's settings. */
  settingsForm!: FormGroup;
  /** The form control for editing the workflow's name. */
  workflowNameControl = this.fb.control('', Validators.required);
  private settingsSub?: Subscription;
  private workflowNameSub?: Subscription;
  
  /** A list of available campaigns for use in 'Send Email' nodes. */
  readonly availableCampaigns = this.campaignService.getCampaigns();
  /** A list of available segments for use in segment-related nodes. */
  readonly availableSegments = this.segmentService.getSegments();
  
  // Toolbar State
  /** The current zoom level of the canvas. */
  readonly zoomLevel = signal(1);
  private history: Workflow[] = [];
  private historyIndex = -1;
  /** A signal indicating if an undo operation is possible. */
  readonly canUndo = signal(false);
  /** A signal indicating if a redo operation is possible. */
  readonly canRedo = signal(false);

  // Mock data for settings footer
  readonly errorCount = signal(4);
  readonly warningCount = signal(54);
  readonly infoCount = signal(1);

  /** A list of conditions available for 'If/Then Branch' nodes. */
  readonly ifThenConditions = [ 'Email Opened', 'Email Clicked', 'Form Submitted', 'Page Visited', 'In Segment' ];

  // Computed properties for rendering and logic
  /** A Map for quick lookup of nodes by their ID. */
  readonly nodesMap = computed(() => new Map(this.workflow()?.nodes.map(n => [n.id, n])));
  /** The workflow node object that is currently selected. */
  readonly selectedNode = computed(() => this.nodesMap().get(this.selectedNodeId() ?? ''));
  
  /** Groups and filters the palette nodes based on the search term. */
  readonly groupedPaletteNodes = computed(() => {
    const term = this.paletteSearchTerm().toLowerCase();
    const groups: { [key: string]: PaletteNode[] } = {
        'Triggers': [], 'Flow Control': [], 'Actions': [], 'End': [],
    };
    const groupMap: { [key in NodeType]: string } = {
        'Trigger': 'Triggers', 'FlowControl': 'Flow Control', 'Action': 'Actions', 'End': 'End',
    };

    const filteredNodes = this.paletteNodes().filter(node => 
        node.subType.toLowerCase().includes(term) || 
        node.description.toLowerCase().includes(term)
    );

    for (const node of filteredNodes) {
        const groupName = groupMap[node.type];
        if (groupName && groups[groupName]) {
            groups[groupName].push(node);
        }
    }

    return [
        { name: 'Triggers', nodes: groups['Triggers'], count: groups['Triggers'].length },
        { name: 'Flow Control', nodes: groups['Flow Control'], count: groups['Flow Control'].length },
        { name: 'Actions', nodes: groups['Actions'], count: groups['Actions'].length },
    ].filter(g => g.nodes.length > 0);
  });

  /** Computes the SVG path data for rendering the edges (lines) between nodes. */
  readonly edgePaths = computed(() => {
    const edges = this.workflow()?.edges ?? [];
    const nodes = this.nodesMap();
    return edges.map(edge => {
        const sourceNode = nodes.get(edge.source);
        const targetNode = nodes.get(edge.target);
        if (!sourceNode || !targetNode) return { path: '', label: null };
        
        let x1: number, y1: number;
        y1 = sourceNode.position.y + NODE_HEIGHT;

        if (sourceNode.subType === 'If/Then Branch') {
            x1 = sourceNode.position.x + (edge.label === 'YES' ? NODE_WIDTH * 0.25 : NODE_WIDTH * 0.75);
        } else {
            x1 = sourceNode.position.x + NODE_WIDTH / 2;
        }

        const x2 = targetNode.position.x + NODE_WIDTH / 2;
        const y2 = targetNode.position.y;
        
        const midY = y1 + VERTICAL_GAP / 2;
        const path = `M ${x1} ${y1} V ${midY} H ${x2} V ${y2}`;
        return { path, label: edge.label, x: x1, y: midY };
    });
  });

  constructor() {
    this.loadInitialData();
    // This effect rebuilds the settings form whenever the selected node changes.
    effect(() => {
        const node = this.selectedNode();
        untracked(() => this.buildSettingsForm(node));
        if (node) this.settingsTab.set('settings');
    });
    // This subscription automatically updates the workflow name in the state
    // when the user types in the header, and records the change for undo/redo.
    this.workflowNameSub = this.workflowNameControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(newName => {
      if (this.workflow() && newName && this.workflowNameControl.valid && this.workflow()!.name !== newName) {
        this.workflow.update(wf => {
          if (wf) {
            return { ...wf, name: newName };
          }
          return wf;
        });
        this.recordState();
      }
    });
  }
  
  ngOnDestroy(): void { 
    this.settingsSub?.unsubscribe();
    this.workflowNameSub?.unsubscribe();
  }

  /**
   * Loads the initial workflow data based on the route parameter and the node catalog.
   */
  private async loadInitialData(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.goBack(); return; }
    const [workflow, catalog] = await Promise.all([
      this.workflowService.getWorkflow(id), this.workflowService.getNodesCatalog()
    ]);
    if (workflow) {
      this.workflow.set(workflow);
      this.workflowNameControl.setValue(workflow.name, { emitEvent: false });
      this.paletteNodes.set(catalog);
      this.recordState(); // Initialize history
    } else { this.goBack(); }
  }

  /**
   * Dynamically builds the settings form based on the type of the selected node.
   * @param node The currently selected workflow node.
   */
 private buildSettingsForm(node?: WorkflowNode): void {
    this.settingsSub?.unsubscribe();
    if (!node) return;
    const s = node.settings;
    // Common controls for all nodes
    const controls: any = {
      nodeName: [s.nodeName || node.subType, Validators.required],
      internalNote: [s.internalNote || ''],
      enableRetries: [s.enableRetries ?? false],
      maxAttempts: [s.maxAttempts || 3],
      delayBetween: [s.delayBetween || '5 minutes'],
      onError: [s.onError || 'Continue to next node'],
      detailedLogging: [s.detailedLogging || false],
      nodeId: [{value: node.id, disabled: true}],
    };
    
    // Node-specific controls
    switch(node.subType) {
        case 'Contact Created':
            controls.triggerEvent = [{value: node.subType, disabled: true}];
            controls.filterConditions = [s.filterConditions || 'all']; break;
        case 'Send Email':
            controls.selectCampaign = [s.selectCampaign || '', Validators.required];
            controls.senderProfile = [s.senderProfile || 'default'];
            controls.trackOpens = [s.trackOpens ?? true];
            controls.trackClicks = [s.trackClicks ?? true]; break;
        case 'Send SMS':
            controls.smsMessage = [s.smsMessage || '', [Validators.required, Validators.maxLength(160)]];
            controls.senderId = [s.senderId || '', Validators.maxLength(11)]; break;
        case 'Wait / Delay':
            controls.waitDurationValue = [s.waitDurationValue || 3, [Validators.required, Validators.min(1)]];
            controls.waitDurationUnit = [s.waitDurationUnit || 'Days'];
            controls.delayType = [s.delayType || 'relative']; break;
        case 'If/Then Branch':
            controls.conditionType = [s.conditionType || 'Email Opened', Validators.required];
            controls.checkWithinValue = [s.checkWithinValue || 3, Validators.min(1)];
            controls.checkWithinUnit = [s.checkWithinUnit || 'Days']; break;
        case 'Joined Segment': case 'Left Segment': case 'Add to Segment':
            controls.segmentId = [s.segmentId || '', Validators.required]; break;
    }
    this.settingsForm = this.fb.group(controls);
    // Subscribe to form changes to update the node state automatically.
    this.settingsSub = this.settingsForm.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
    ).subscribe(v => {
      this.updateNodeSettings(node.id, v);
      this.recordState();
    });
 }

  /** Navigates back to the main workflows list. */
  goBack() { this.router.navigate(['/map/workflows']); }
  /** Selects a node on the canvas. */
  selectNode(event: MouseEvent, nodeId: string | null) { event.stopPropagation(); this.selectedNodeId.set(nodeId); }
  /** Deselects any currently selected node. */
  deselectNode() { this.selectedNodeId.set(null); }
  /** Updates the palette search term. */
  onPaletteSearch(event: Event) { this.paletteSearchTerm.set((event.target as HTMLInputElement).value); }
  
  // Drag and Drop Handlers
  onPaletteDragStart(event: DragEvent, node: PaletteNode) { this.draggedPaletteNode.set(node); event.dataTransfer!.effectAllowed = 'move'; }
  onDragLeave() { this.activeDropZone.set(null); }
  onDrop(event: DragEvent, parentId: string, label?: 'YES' | 'NO') {
    event.preventDefault();
    const dragged = this.draggedPaletteNode();
    if (dragged) this.addNode(parentId, dragged, label);
    this.activeDropZone.set(null); this.draggedPaletteNode.set(null);
  }
  onCanvasNodeDragStart(event: DragEvent, nodeId: string) {
    const target = event.target as HTMLElement;
    const rect = target.getBoundingClientRect();
    this.draggedCanvasNode.set({ id: nodeId, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top });
    event.dataTransfer!.effectAllowed = 'move';
  }
  onCanvasDragOver(event: DragEvent, isDropZone: boolean, parentId?: string, label?: 'YES' | 'NO') {
    event.preventDefault();
    this.activeDropZone.set(isDropZone && parentId ? { parentId, label } : null);
  }
  onCanvasDrop(event: DragEvent) {
    event.preventDefault();
    const draggedNode = this.draggedCanvasNode();
    if (draggedNode) {
      const canvas = (event.currentTarget as HTMLElement);
      const canvasRect = canvas.getBoundingClientRect();
      const zoom = this.zoomLevel();
      const newX = (event.clientX - canvasRect.left) / zoom - draggedNode.offsetX / zoom;
      const newY = (event.clientY - canvasRect.top) / zoom - draggedNode.offsetY / zoom;
      this.updateNodePosition(draggedNode.id, { x: newX, y: newY });
      this.recordState();
    }
    this.draggedCanvasNode.set(null);
  }

  /**
   * Updates the position of a node in the workflow state.
   * @param nodeId The ID of the node to move.
   * @param pos The new {x, y} coordinates.
   */
  updateNodePosition(nodeId: string, pos: { x: number; y: number }) {
    this.workflow.update(wf => {
      if (!wf) return;
      const node = wf.nodes.find(n => n.id === nodeId);
      if (node) { node.position = pos; }
      return { ...wf, nodes: [...wf.nodes] };
    });
  }

  /**
   * Adds a new node to the workflow, connecting it to a parent node.
   * @param parentId The ID of the node to connect the new node to. Can be 'root'.
   * @param paletteNode The node data from the palette.
   * @param label Optional label ('YES'/'NO') for branching logic.
   */
  addNode(parentId: string, paletteNode: PaletteNode, label?: 'YES' | 'NO') {
    if (parentId === 'root' && paletteNode.type !== 'Trigger') {
      alert('The first node must be a Trigger.');
      return;
    }

    this.workflow.update(wf => {
      if (!wf) return;
      
      const newId = `node_${Date.now()}`;
      let newPosition = { x: 400, y: 50 }; // Default position for the root node

      if (parentId !== 'root') {
        const parentNode = this.nodesMap().get(parentId)!;
        newPosition.y = parentNode.position.y + NODE_HEIGHT + VERTICAL_GAP;
        if (parentNode.subType === 'If/Then Branch') {
          const offset = (NODE_WIDTH + HORIZONTAL_GAP) / 2;
          newPosition.x = parentNode.position.x + (label === 'YES' ? -offset : offset);
        } else {
          newPosition.x = parentNode.position.x;
        }
      }

      const newNode: WorkflowNode = {
        id: newId, type: paletteNode.type, subType: paletteNode.subType,
        settings: { nodeName: paletteNode.subType }, position: newPosition,
      };

      if (parentId !== 'root') {
        const newEdge: WorkflowEdge = { id: `edge_${Date.now()}`, source: parentId, target: newId, label };
        const oldEdge = wf.edges.find(e => e.source === parentId && e.label === label);

        if (oldEdge) {
          // If a node is dropped in the middle of an existing edge, rewire the connections.
          const oldTargetId = oldEdge.target;
          oldEdge.target = newId;
          wf.edges.push({ id: `edge_${Date.now()}_2`, source: newId, target: oldTargetId });
        } else {
          wf.edges.push(newEdge);
        }
      }

      wf.nodes.push(newNode);
      const updatedWf = { ...wf, nodes: [...wf.nodes], edges: wf.edges ? [...wf.edges] : [] };
      this.recordState(updatedWf);
      return updatedWf;
    });
  }

  /** Updates the settings of a specific node. */
  updateNodeSettings(nodeId: string, newSettings: any) { this.workflow.update(wf => { if (!wf) return; const node = wf.nodes.find(n => n.id === nodeId); if (node) node.settings = { ...node.settings, ...newSettings }; return { ...wf }; }); }
  
  /** Checks if a node already has a child connected to a specific output (e.g., the 'YES' branch). */
  hasChildFor(nodeId: string, label?: 'YES' | 'NO'): boolean {
    return this.workflow()?.edges.some(e => e.source === nodeId && e.label === label) ?? false;
  }
  
  /** Deletes the currently selected node and attempts to reconnect its parent and child. */
  deleteSelectedNode() { 
    const nodeId = this.selectedNodeId(); 
    if (!nodeId || (this.workflow()?.nodes.length > 0 && this.workflow()?.nodes[0].id === nodeId)) return; // Cannot delete the root trigger node
    
    this.workflow.update(wf => { 
      if (!wf) return; 
      
      const parentEdge = wf.edges.find(e => e.target === nodeId);
      const childEdge = wf.edges.find(e => e.source === nodeId); // Note: this simple logic only handles linear paths
      
      wf.nodes = wf.nodes.filter(n => n.id !== nodeId); 
      wf.edges = wf.edges.filter(e => e.source !== nodeId && e.target !== nodeId); 

      // Reconnect parent to child for simple linear cases to avoid breaking the flow.
      if (parentEdge && childEdge) {
        wf.edges.push({ ...parentEdge, target: childEdge.target, id: `edge_${Date.now()}` });
      }
      
      const updatedWf = { ...wf, nodes: [...wf.nodes], edges: [...wf.edges] }; 
      this.recordState(updatedWf);
      return updatedWf;
    }); 
    
    this.deselectNode(); 
  }

  /** Saves the current workflow state and navigates back to the list view. */
  async saveAndExit(): Promise<void> { 
    if (this.workflow() && this.workflowNameControl.valid) {
      const wfToSave = {
        ...this.workflow()!,
        name: this.workflowNameControl.value!
      };
      await this.workflowService.saveWorkflow(wfToSave); 
      this.goBack(); 
    }
  }

  // Toolbar methods
  zoomIn() { this.zoomLevel.update(z => Math.min(2, z + 0.1)); }
  zoomOut() { this.zoomLevel.update(z => Math.max(0.5, z - 0.1)); }
  resetZoom() { this.zoomLevel.set(1); }

  /**
   * Records the current state of the workflow for undo/redo functionality.
   * @param wf The workflow state to record. Defaults to the current state.
   */
  private recordState(wf: Workflow | undefined = this.workflow()) {
    if (!wf) return;
    // If we undo and then make a change, we need to clear the "redo" history.
    if (this.historyIndex < this.history.length - 1) {
        this.history.splice(this.historyIndex + 1);
    }
    this.history.push(deepClone(wf));
    this.historyIndex++;
    this.updateHistoryButtons();
  }

  /** Reverts to the previous state in the history. */
  undo() {
    if (this.canUndo()) {
        this.historyIndex--;
        this.workflow.set(deepClone(this.history[this.historyIndex]));
        this.updateHistoryButtons();
    }
  }

  /** Moves forward to the next state in the history. */
  redo() {
      if (this.canRedo()) {
          this.historyIndex++;
          this.workflow.set(deepClone(this.history[this.historyIndex]));
          this.updateHistoryButtons();
      }
  }
  
  /** Updates the canUndo and canRedo signals based on the current history index. */
  private updateHistoryButtons() {
      this.canUndo.set(this.historyIndex > 0);
      this.canRedo.set(this.historyIndex < this.history.length - 1);
  }
}

function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}
