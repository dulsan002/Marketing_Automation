import { ChangeDetectionStrategy, Component, output, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  /** The data for the workflow node to be rendered. */
  node = input.required<WorkflowNode>();
  /** The ID of the currently selected node in the parent builder component. */
  selectedNodeId = input<string | null>(null);

  /** Emits when the node card is clicked, signaling the parent to select it. */
  selectNode = output<MouseEvent>();

  /** A computed property that finds the appropriate SVG icon path for the node based on its subtype. */
  nodeIcon = computed(() => MOCK_WORKFLOW_NODES_CATALOG.find(n => n.subType === this.node()?.subType)?.icon);

  /**
   * Determines the border and background color classes for the node based on its type.
   * This provides a clear visual distinction between Triggers, Actions, and Flow Control nodes.
   * @param type The primary type of the node.
   * @returns A string of Tailwind CSS classes.
   */
  getNodeColorClass(type?: NodeType) {
    if (this.node().subType === 'Wait / Delay') return 'border-orange-300 bg-orange-50';
    const colors = {
      Trigger: 'border-green-400 bg-green-50/80',
      FlowControl: 'border-blue-400 bg-blue-50/80',
      Action: 'border-teal-400 bg-teal-50/80',
      End: 'border-gray-300 bg-gray-50/80',
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
    const colors = {
      Trigger: 'text-green-700',
      FlowControl: 'text-blue-700',
      Action: 'text-teal-700',
      End: 'text-gray-700',
    };
    return type ? colors[type] : colors['Action'];
  }
}
