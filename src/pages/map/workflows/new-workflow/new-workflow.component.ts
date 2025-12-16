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

const NODE_WIDTH = 320; // 80 in tailwind units (w-80)
const NODE_HEIGHT = 72; // approx height of a node card
const VERTICAL_GAP = 80;
const HORIZONTAL_GAP = 40;

@Component({
  selector: 'app-workflow-builder',
  imports: [CommonModule, ReactiveFormsModule, WorkflowNodeComponent],
  templateUrl: './new-workflow.component.html',
  styleUrls: ['./new-workflow.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowBuilderComponent implements OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private elementRef = inject(ElementRef);
  private workflowService = inject(WorkflowService);
  private campaignService = inject(CampaignService);
  private segmentService = inject(SegmentService);

  readonly workflow = signal<Workflow | undefined>(undefined);
  readonly paletteNodes = signal<PaletteNode[]>([]);
  readonly selectedNodeId = signal<string | null>(null);
  readonly paletteSearchTerm = signal('');

  // Drag & Drop State
  readonly draggedPaletteNode = signal<PaletteNode | null>(null);
  readonly draggedCanvasNode = signal<{ id: string; offsetX: number; offsetY: number } | null>(null);
  readonly activeDropZone = signal<{ parentId: string, label?: 'YES' | 'NO' } | null>(null);

  // Settings Panel State
  readonly settingsTab = signal<'settings' | 'advanced'>('settings');
  settingsForm!: FormGroup;
  workflowNameControl = this.fb.control('', Validators.required);
  private settingsSub?: Subscription;
  private workflowNameSub?: Subscription;
  readonly availableCampaigns = this.campaignService.getCampaigns();
  readonly availableSegments = this.segmentService.getSegments();
  
  // Toolbar State
  readonly zoomLevel = signal(1);
  private history: Workflow[] = [];
  private historyIndex = -1;
  readonly canUndo = signal(false);
  readonly canRedo = signal(false);

  // Mock data for settings footer
  readonly errorCount = signal(4);
  readonly warningCount = signal(54);
  readonly infoCount = signal(1);

  readonly ifThenConditions = [ 'Email Opened', 'Email Clicked', 'Form Submitted', 'Page Visited', 'In Segment' ];

  // Computed properties for rendering and logic
  readonly nodesMap = computed(() => new Map(this.workflow()?.nodes.map(n => [n.id, n])));
  readonly selectedNode = computed(() => this.nodesMap().get(this.selectedNodeId() ?? ''));
  
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
    effect(() => {
        const node = this.selectedNode();
        untracked(() => this.buildSettingsForm(node));
        if (node) this.settingsTab.set('settings');
    });
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
      this.recordState();
    } else { this.goBack(); }
  }

 private buildSettingsForm(node?: WorkflowNode): void {
    this.settingsSub?.unsubscribe();
    if (!node) return;
    const s = node.settings;
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
    this.settingsSub = this.settingsForm.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
    ).subscribe(v => {
      this.updateNodeSettings(node.id, v);
      this.recordState();
    });
 }

  goBack() { this.router.navigate(['/map/workflows']); }
  selectNode(event: MouseEvent, nodeId: string | null) { event.stopPropagation(); this.selectedNodeId.set(nodeId); }
  deselectNode() { this.selectedNodeId.set(null); }
  onPaletteSearch(event: Event) { this.paletteSearchTerm.set((event.target as HTMLInputElement).value); }
  
  // Drag from Palette
  onPaletteDragStart(event: DragEvent, node: PaletteNode) { this.draggedPaletteNode.set(node); event.dataTransfer!.effectAllowed = 'move'; }
  onDragLeave() { this.activeDropZone.set(null); }
  onDrop(event: DragEvent, parentId: string, label?: 'YES' | 'NO') {
    event.preventDefault();
    const dragged = this.draggedPaletteNode();
    if (dragged) this.addNode(parentId, dragged, label);
    this.activeDropZone.set(null); this.draggedPaletteNode.set(null);
  }
  
  // Drag existing Node on Canvas
  onCanvasNodeDragStart(event: DragEvent, nodeId: string) {
    const target = event.target as HTMLElement;
    const rect = target.getBoundingClientRect();
    this.draggedCanvasNode.set({
      id: nodeId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    });
    event.dataTransfer!.effectAllowed = 'move';
  }

  onCanvasDragOver(event: DragEvent, isDropZone: boolean, parentId?: string, label?: 'YES' | 'NO') {
    event.preventDefault();
    if (isDropZone && parentId) {
      this.activeDropZone.set({ parentId, label: label });
    } else {
      this.activeDropZone.set(null);
    }
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

  updateNodePosition(nodeId: string, pos: { x: number; y: number }) {
    this.workflow.update(wf => {
      if (!wf) return;
      const node = wf.nodes.find(n => n.id === nodeId);
      if (node) { node.position = pos; }
      return { ...wf, nodes: [...wf.nodes] };
    });
  }

  addNode(parentId: string, paletteNode: PaletteNode, label?: 'YES' | 'NO') {
    if (parentId === 'root' && paletteNode.type !== 'Trigger') {
      alert('The first node must be a Trigger.');
      return;
    }

    this.workflow.update(wf => {
      if (!wf) return;
      
      const newId = `node_${Date.now()}`;
      let newPosition = { x: 400, y: 50 }; // Default for root

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

  updateNodeSettings(nodeId: string, newSettings: any) { this.workflow.update(wf => { if (!wf) return; const node = wf.nodes.find(n => n.id === nodeId); if (node) node.settings = { ...node.settings, ...newSettings }; return { ...wf }; }); }
  
  hasChildFor(nodeId: string, label?: 'YES' | 'NO'): boolean {
    const wf = this.workflow();
    if (!wf?.edges) {
      return false;
    }
    return wf.edges.some(e => e.source === nodeId && e.label === label);
  }
  
  deleteSelectedNode() { 
    const nodeId = this.selectedNodeId(); 
    if (!nodeId || (this.workflow()?.nodes.length > 0 && this.workflow()?.nodes[0].id === nodeId)) return; 
    
    this.workflow.update(wf => { 
      if (!wf) return; 
      
      const parentEdge = wf.edges.find(e => e.target === nodeId);
      const childEdge = wf.edges.find(e => e.source === nodeId); // Note: this simple logic only handles linear paths
      
      wf.nodes = wf.nodes.filter(n => n.id !== nodeId); 
      wf.edges = wf.edges.filter(e => e.source !== nodeId && e.target !== nodeId); 

      if (parentEdge && childEdge) {
        // Reconnect parent to child for simple linear cases
        wf.edges.push({ ...parentEdge, target: childEdge.target, id: `edge_${Date.now()}` });
      }
      
      const updatedWf = { ...wf, nodes: [...wf.nodes], edges: [...wf.edges] }; 
      this.recordState(updatedWf);
      return updatedWf;
    }); 
    
    this.deselectNode(); 
  }

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

  private recordState(wf: Workflow | undefined = this.workflow()) {
    if (!wf) return;
    if (this.historyIndex < this.history.length - 1) {
        this.history.splice(this.historyIndex + 1);
    }
    this.history.push(JSON.parse(JSON.stringify(wf)));
    this.historyIndex++;
    this.updateHistoryButtons();
  }

  undo() {
    if (this.canUndo()) {
        this.historyIndex--;
        this.workflow.set(JSON.parse(JSON.stringify(this.history[this.historyIndex])));
        this.updateHistoryButtons();
    }
  }

  redo() {
      if (this.canRedo()) {
          this.historyIndex++;
          this.workflow.set(JSON.parse(JSON.stringify(this.history[this.historyIndex])));
          this.updateHistoryButtons();
      }
  }

  private updateHistoryButtons() {
      this.canUndo.set(this.historyIndex > 0);
      this.canRedo.set(this.historyIndex < this.history.length - 1);
  }
}
