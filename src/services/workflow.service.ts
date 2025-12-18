import { Injectable, signal } from '@angular/core';
import { Workflow, WorkflowNode, PaletteNode, WorkflowTemplate } from '../types';
import { MOCK_WORKFLOWS, MOCK_WORKFLOW_NODES_CATALOG, MOCK_WORKFLOW_TEMPLATES } from '../data/mock-data';

// Helper for deep cloning
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

@Injectable({
  providedIn: 'root',
})
export class WorkflowService {
  private workflowsSignal = signal<Workflow[]>(MOCK_WORKFLOWS);
  private catalog = signal<PaletteNode[]>(MOCK_WORKFLOW_NODES_CATALOG);
  private templates = signal<WorkflowTemplate[]>(MOCK_WORKFLOW_TEMPLATES);

  // Simulate async operations
  private async a(callback: () => void, delay = 100) {
    return new Promise<void>(resolve => setTimeout(() => {
      callback();
      resolve();
    }, delay));
  }

  private async b<T>(callback: () => T, delay = 100): Promise<T> {
    return new Promise<T>(resolve => setTimeout(() => {
      resolve(callback());
    }, delay));
  }

  getWorkflows(): Promise<Workflow[]> {
    return this.b(() => deepClone(this.workflowsSignal()));
  }

  getWorkflow(id: string): Promise<Workflow | undefined> {
    return this.b(() => deepClone(this.workflowsSignal().find(w => w.id === id)));
  }

  getNodesCatalog(): Promise<PaletteNode[]> {
    return this.b(() => deepClone(this.catalog()));
  }

  getTemplates(): Promise<WorkflowTemplate[]> {
    return this.b(() => deepClone(this.templates()));
  }

  async saveWorkflow(workflowToSave: Workflow): Promise<Workflow> {
    await this.a(() => {
      const triggerNode = workflowToSave.nodes?.find(n => n.type === 'Trigger');
      const triggerText = triggerNode ? this.getTriggerText(triggerNode) : 'Not configured';

      const updatedWorkflow: Workflow = {
        ...workflowToSave,
        trigger: triggerText,
        modified: new Date().toLocaleDateString(),
      };

      this.workflowsSignal.update(workflows =>
        workflows.map(w => w.id === updatedWorkflow.id ? updatedWorkflow : w)
      );
    });
    return deepClone(workflowToSave);
  }

  deleteWorkflow(workflowId: string): Promise<void> {
    return this.a(() => {
      this.workflowsSignal.update(workflows =>
        workflows.filter(w => w.id !== workflowId)
      );
    });
  }

  updateWorkflowStatus(workflowId: string, status: Workflow['status']): Promise<void> {
    return this.a(() => {
      this.workflowsSignal.update(workflows =>
        workflows.map(w =>
          w.id === workflowId ? { ...w, status, modified: new Date().toLocaleDateString() } : w
        )
      );
    });
  }

  createNewWorkflow(): Promise<Workflow> {
    return this.b(() => {
      const newWorkflow: Workflow = {
        id: `wf_${Date.now()}`,
        name: 'Untitled Workflow',
        description: 'No description provided.',
        trigger: 'Not configured',
        status: 'draft',
        stats: { enrolled: 0, sent: 0, converted: 0 },
        modified: new Date().toLocaleDateString(),
        nodes: [],
        edges: [],
      };
      this.workflowsSignal.update(workflows => [newWorkflow, ...workflows]);
      return deepClone(newWorkflow);
    });
  }

  createWorkflowFromTemplate(templateId: string): Promise<Workflow> {
    return this.b(() => {
      const template = this.templates().find(t => t.id === templateId);
      if (!template) throw new Error('Template not found');

      const newWorkflow: Workflow = {
        id: `wf_${Date.now()}`,
        ...deepClone(template.workflow),
        status: 'draft',
        stats: { enrolled: 0, sent: 0, converted: 0 },
        modified: new Date().toLocaleDateString(),
      };
      this.workflowsSignal.update(workflows => [newWorkflow, ...workflows]);
      return deepClone(newWorkflow);
    });
  }

  private getTriggerText(triggerNode: WorkflowNode): string {
    let text: string = triggerNode.subType;
    if (triggerNode.subType.includes('Segment') && triggerNode.settings.segmentId) {
      const verb = triggerNode.subType.startsWith('Joined') ? 'Joins' : 'Leaves';
      text = `${verb} '${triggerNode.settings.segmentId}' segment`;
    }
    return text;
  }
}