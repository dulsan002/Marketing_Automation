import { ChangeDetectionStrategy, Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Workflow } from '../../../types';
import { WorkflowService } from '../../../services/workflow.service';
import { WorkflowTemplateSelectorComponent } from './workflow-template-selector/workflow-template-selector.component';

@Component({
  selector: 'app-workflows',
  imports: [CommonModule, RouterModule, WorkflowTemplateSelectorComponent],
  templateUrl: './workflows.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowsComponent {
  private workflowService = inject(WorkflowService);
  private router = inject(Router);

  readonly workflows = signal<Workflow[]>([]);
  readonly activeDropdown = signal<string | null>(null);
  readonly statusFilter = signal<'all' | Workflow['status']>('all');
  readonly searchTerm = signal('');
  readonly showTemplateSelector = signal(false);
  readonly isLoading = signal(true);

  constructor() {
    this.loadWorkflows();
  }

  async loadWorkflows(): Promise<void> {
    this.isLoading.set(true);
    const workflows = await this.workflowService.getWorkflows();
    this.workflows.set(workflows);
    this.isLoading.set(false);
  }

  readonly filteredWorkflows = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const status = this.statusFilter();
    return this.workflows().filter(w => {
      const nameMatch = w.name.toLowerCase().includes(term);
      const statusMatch = status === 'all' || w.status === status;
      return nameMatch && statusMatch;
    });
  });

  readonly statuses: Workflow['status'][] = ['active', 'paused', 'draft'];

  onSearch(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  onFilterChange(event: Event) {
    this.statusFilter.set((event.target as HTMLSelectElement).value as Workflow['status']);
  }

  toggleDropdown(workflowId: string): void {
    this.activeDropdown.update(current => current === workflowId ? null : workflowId);
  }

  async deleteWorkflow(workflowId: string): Promise<void> {
    await this.workflowService.deleteWorkflow(workflowId);
    this.activeDropdown.set(null);
    this.loadWorkflows();
  }

  async toggleStatus(workflow: Workflow): Promise<void> {
    const newStatus = workflow.status === 'active' ? 'paused' : 'active';
    await this.workflowService.updateWorkflowStatus(workflow.id, newStatus);
    this.loadWorkflows();
  }
  
  async handleTemplateSelection(choice: 'scratch' | string | null): Promise<void> {
    this.showTemplateSelector.set(false);
    if (choice === null) return;
    
    this.isLoading.set(true);
    try {
      const newWorkflow = choice === 'scratch'
        ? await this.workflowService.createNewWorkflow()
        : await this.workflowService.createWorkflowFromTemplate(choice);
      
      this.router.navigate(['/map/workflows/builder', newWorkflow.id]);
    } catch (error) {
      console.error("Failed to create workflow:", error);
      // Here you would show an error toast to the user
    } finally {
       // No need to set isLoading to false, as the page will navigate away
    }
  }

  getStatusClass(status: Workflow['status']): string {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}