import { ChangeDetectionStrategy, Component, output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkflowTemplate } from '../../../../types';
import { WorkflowService } from '../../../../services/workflow.service';

@Component({
  selector: 'app-workflow-template-selector',
  imports: [CommonModule],
  templateUrl: './workflow-template-selector.component.html',
  styleUrls: ['./workflow-template-selector.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowTemplateSelectorComponent {
  select = output<'scratch' | string | null>();
  private workflowService = inject(WorkflowService);

  readonly templates = signal<WorkflowTemplate[]>([]);
  readonly isLoading = signal(true);

  constructor() {
    this.loadTemplates();
  }

  async loadTemplates(): Promise<void> {
    this.isLoading.set(true);
    const templates = await this.workflowService.getTemplates();
    this.templates.set(templates);
    this.isLoading.set(false);
  }

  onSelect(choice: 'scratch' | string) {
    this.select.emit(choice);
  }

  close() {
    this.select.emit(null);
  }
}