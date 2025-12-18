import { ChangeDetectionStrategy, Component, output, computed, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { WorkflowNode, NodeType } from '../../../../../types';
import { MOCK_WORKFLOW_NODES_CATALOG } from '../../../../../data/mock-data';

/**
 * A presentational component that renders a single node on the workflow canvas.
 * It displays the node's name, an icon, and other relevant details. It also
 * handles the visual state for selection and different node types.
 */
@Component({
  selector: 'app-workflow-node',
  imports: [CommonModule],
  templateUrl: './workflow-node.component.html',
  styleUrls: ['./workflow-node.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowNodeComponent {
  private sanitizer = inject(DomSanitizer);

  /** The data for the workflow node to be rendered. */
  node = input.required<WorkflowNode>();
  /** The ID of the currently selected node in the parent builder component. */
  selectedNodeId = input<string | null>(null);

  /** Emits when the node card is clicked, signaling the parent to select it. */
  selectNode = output<MouseEvent>();

  isSelected = computed(() => this.selectedNodeId() === this.node().id);

  onNodeClick(event: MouseEvent) {
    this.selectNode.emit(event);
  }

  /** A computed property that finds the appropriate SVG icon path for the node based on its subtype. */
  nodeIcon = computed<SafeHtml | undefined>(() => {
    const iconString = MOCK_WORKFLOW_NODES_CATALOG.find(n => n.subType === this.node()?.subType)?.icon;
    return iconString ? this.sanitizer.bypassSecurityTrustHtml(iconString) : undefined;
  });

  /**
   * Determines the border and background color classes for the node based on its type.
   * This provides a clear visual distinction between Triggers, Actions, and Flow Control nodes.
   * @param type The primary type of the node.
   * @returns A string of Tailwind CSS classes.
   */
  getNodeColorClass(type?: NodeType) {
    if (this.node().subType === 'Wait / Delay') return 'border-orange-300 bg-orange-50/90';
    if (this.node().subType === 'A/B Split Test') return 'border-purple-300 bg-purple-50/90';

    const colors = {
      Trigger: 'border-green-400 bg-green-50/90',
      FlowControl: 'border-blue-400 bg-blue-50/90',
      Action: 'border-teal-400 bg-teal-50/90',
      End: 'border-gray-300 bg-gray-50/90',
    };
    return type ? colors[type] : colors['Action'];
  }

  /**
   * Determines the text color class for the node's icon based on its type.
   * @param type The primary type of the node.
   * @returns A string of Tailwind CSS classes.
   */
  getNodeTextColor(type?: NodeType) {
    if (this.node().subType === 'Wait / Delay') return 'text-orange-700';
    if (this.node().subType === 'A/B Split Test') return 'text-purple-700';

    const colors = {
      Trigger: 'text-green-700',
      FlowControl: 'text-blue-700',
      Action: 'text-teal-700',
      End: 'text-gray-700',
    };
    return type ? colors[type] : colors['Action'];
  }

  /**
   * Gets a short summary of the node's configuration.
   */
  getNodeSummary(): string {
    const n = this.node();
    if (!n) return '';

    switch (n.subType) {
      case 'Send Email': return n.settings['selectCampaign'] ? `Campaign: ${n.settings['selectCampaign']}` : 'Select a campaign';
      case 'Wait / Delay': return `Wait ${n.settings['waitDurationValue'] || 0} ${n.settings['waitDurationUnit'] || 'Days'}`;
      case 'If/Then Branch': return `Condition: ${n.settings['conditionType'] || 'Set condition'}`;
      case 'A/B Split Test': return `Split: ${n.settings['distributionA'] || 50}/${100 - (n.settings['distributionA'] || 50)}`;
      case 'Add to Segment': return n.settings['segmentId'] ? `Add to: ${n.settings['segmentId']}` : 'Select segment';
      case 'Joined Segment': return n.settings['segmentId'] ? `Joined: ${n.settings['segmentId']}` : 'Select segment';
      default: return n.settings['internalNote'] || n.subType;
    }
  }
}
