import { ChangeDetectionStrategy, Component, output, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkflowNode, NodeType } from '../../../../../types';
import { MOCK_WORKFLOW_NODES_CATALOG } from '../../../../../data/mock-data';

@Component({
  selector: 'app-workflow-node',
  imports: [CommonModule],
  templateUrl: './workflow-node.component.html',
  styleUrls: ['./workflow-node.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowNodeComponent {
  node = input.required<WorkflowNode>();
  selectedNodeId = input<string | null>(null);

  selectNode = output<MouseEvent>();

  nodeIcon = computed(() => MOCK_WORKFLOW_NODES_CATALOG.find(n => n.subType === this.node()?.subType)?.icon);

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