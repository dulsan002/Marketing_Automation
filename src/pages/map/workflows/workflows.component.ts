import { ChangeDetectionStrategy, Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Workflow } from '../../../types';
import { WorkflowService } from '../../../services/workflow.service';
import { WorkflowTemplateSelectorComponent } from './workflow-template-selector/workflow-template-selector.component';

/**
 * Manages the display and interaction of the main workflows list.
 * This component is responsible for fetching and displaying workflow cards,
 * handling filtering and searching, and initiating the creation of new workflows
 * either from scratch or from a template.
 */
@Component({
  selector: 'app-workflows',
  imports: [CommonModule, RouterModule, WorkflowTemplateSelectorComponent],
  templateUrl: './workflows.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowsComponent {
  private workflowService = inject(WorkflowService);
  private router = inject(Router);

  /** Signal holding the master list of all workflows. */
  readonly workflows = signal<Workflow[]>([]);
  /** Manages which workflow's action dropdown is currently visible. Null if none are open. */
  readonly activeDropdown = signal<string | null>(null);
  /** The current status filter applied to the workflow list. */
  readonly statusFilter = signal<'all' | Workflow['status']>('all');
  /** The current search term entered by the user. */
  readonly searchTerm = signal('');
  /** Controls the visibility of the template selector modal. */
  readonly showTemplateSelector = signal(false);
  /** Indicates whether the component is currently fetching workflow data. */
  readonly isLoading = signal(true);

  constructor() {
    this.loadWorkflows();
  }

  /**
   * Fetches the list of workflows from the service and updates the component's state.
   */
  async loadWorkflows(): Promise<void> {
    this.isLoading.set(true);
    const workflows = await this.workflowService.getWorkflows();
    this.workflows.set(workflows);
    this.isLoading.set(false);
  }

  /** A computed signal that returns a filtered list of workflows based on the current search term and status filter. */
  readonly filteredWorkflows = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const status = this.statusFilter();
    return this.workflows().filter(w => {
      const nameMatch = w.name.toLowerCase().includes(term);
      const statusMatch = status === 'all' || w.status === status;
      return nameMatch && statusMatch;
    });
  });

  /** An array of possible workflow statuses, used for populating the filter dropdown. */
  readonly statuses: Workflow['status'][] = ['active', 'paused', 'draft'];

  /**
   * Updates the search term signal based on user input.
   * @param event The input event from the search field.
   */
  onSearch(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  /**
   * Updates the status filter signal based on user selection.
   * @param event The change event from the status filter dropdown.
   */
  onFilterChange(event: Event) {
    this.statusFilter.set((event.target as HTMLSelectElement).value as Workflow['status']);
  }

  /**
   * Toggles the visibility of the action dropdown menu for a specific workflow.
   * @param workflowId The ID of the workflow whose dropdown should be toggled.
   */
  toggleDropdown(workflowId: string): void {
    this.activeDropdown.update(current => current === workflowId ? null : workflowId);
  }

  /**
   * Deletes a workflow and reloads the list.
   * @param workflowId The ID of the workflow to delete.
   */
  async deleteWorkflow(workflowId: string): Promise<void> {
    await this.workflowService.deleteWorkflow(workflowId);
    this.activeDropdown.set(null);
    this.loadWorkflows();
  }

  /**
   * Toggles the status of a workflow between 'active' and 'paused'.
   * @param workflow The workflow object whose status is to be toggled.
   */
  async toggleStatus(workflow: Workflow): Promise<void> {
    const newStatus = workflow.status === 'active' ? 'paused' : 'active';
    await this.workflowService.updateWorkflowStatus(workflow.id, newStatus);
    this.loadWorkflows();
  }
  
  /**
   * Handles the user's choice from the template selector modal.
   * It either creates a new blank workflow or one from a template, then navigates
   * to the workflow builder.
   * @param choice The ID of the selected template, 'scratch' for a blank workflow, or null if cancelled.
   */
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
      // In a real app, this would show an error toast to the user
    } finally {
       // No need to set isLoading to false, as the page will navigate away
    }
  }

  /**
   * Determines the Tailwind CSS classes for a workflow's status badge.
   * @param status The status of the workflow.
   * @returns A string of CSS classes.
   */
  getStatusClass(status: Workflow['status']): string {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}
