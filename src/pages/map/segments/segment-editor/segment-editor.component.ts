import { ChangeDetectionStrategy, Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormArray, FormGroup } from '@angular/forms';
import { SegmentService } from '../../../../services/segment.service';
import { MOCK_SAMPLE_CONTACTS } from '../../../../data/mock-data';
import { ProspectSegment, SampleContact, SegmentRuleGroup } from '../../../../types';

/**
 * A full-screen component for creating and editing prospect segments.
 * It features a dynamic form that allows users to build complex rule-based logic
 * with multiple rule groups and conditions (AND/OR). The component handles both
 * creation of new segments and editing of existing ones based on the route URL.
 */
@Component({
  selector: 'app-segment-editor',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './segment-editor.component.html',
  styleUrls: ['./segment-editor.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentEditorComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private segmentService = inject(SegmentService);

  /** The ID of the segment being edited, or null if creating a new one. */
  readonly segmentId = signal<string | null>(null);
  /** A list of sample contacts to show in the preview panel. */
  readonly sampleMatches = signal<SampleContact[]>(MOCK_SAMPLE_CONTACTS);
  /** A computed signal that returns true if the component is in edit mode. */
  readonly isEditMode = computed(() => this.segmentId() !== null);

  /** The list of available fields for creating segment rules. */
  readonly fields = ['Email', 'First Name', 'Last Name', 'Company', 'Job Title', 'Country', 'Created Date', 'Last Purchase Date', 'Total Spent', 'Order Count', 'Email Opened'];
  /** The list of available operators for creating segment rules. */
  readonly operators = ['equals', 'does not equal', 'contains', 'does not contain', 'starts with', 'ends with', 'is greater than', 'is less than', 'is set', 'is not set', 'in the last'];

  /** The main reactive form for the segment editor. */
  segmentForm = this.fb.group({
    segmentName: [''],
    description: [''],
    ruleGroups: this.fb.array([this.createRuleGroup()])
  });

  constructor() {
    // Check for an 'id' in the route parameters to determine if we are in edit mode.
    this.route.paramMap.subscribe(async params => {
      const id = params.get('id');
      if (id) {
        this.segmentId.set(id);
        const segment = await this.segmentService.getSegment(id);
        if (segment) {
          this.patchForm(segment);
        }
      }
    });
  }

  /**
   * Populates the form with data from an existing segment when in edit mode.
   * @param segment The segment data to load into the form.
   */
  patchForm(segment: ProspectSegment): void {
    this.segmentForm.patchValue({
      segmentName: segment.name,
      description: segment.description
    });

    this.ruleGroups.clear();
    segment.ruleGroups.forEach(group => {
      this.ruleGroups.push(this.createRuleGroup(group));
    });
  }

  /** A getter for easy access to the `ruleGroups` FormArray. */
  get ruleGroups() {
    return this.segmentForm.get('ruleGroups') as FormArray;
  }

  /**
   * Creates a new FormGroup representing a rule group.
   * @param group Optional data to initialize the group with.
   * @returns A FormGroup for a rule group.
   */
  createRuleGroup(group?: SegmentRuleGroup): FormGroup {
    const rules = group?.rules.map(rule => this.createRule(rule)) || [this.createRule()];
    return this.fb.group({
      condition: [group?.condition || 'AND'],
      rules: this.fb.array(rules)
    });
  }

  /**
   * Creates a new FormGroup representing a single rule.
   * @param rule Optional data to initialize the rule with.
   * @returns A FormGroup for a single rule.
   */
  createRule(rule?: { field: string, operator: string, value: string }): FormGroup {
    return this.fb.group({
      field: [rule?.field || this.fields[0]],
      operator: [rule?.operator || this.operators[0]],
      value: [rule?.value || '']
    });
  }

  /** Adds a new, empty rule group to the form. */
  addRuleGroup() {
    this.ruleGroups.push(this.createRuleGroup());
  }

  /**
   * Removes a rule group from the form at a specific index.
   * @param index The index of the rule group to remove.
   */
  removeRuleGroup(index: number) {
    this.ruleGroups.removeAt(index);
  }

  /**
   * A getter for easy access to the `rules` FormArray within a specific rule group.
   * @param groupIndex The index of the parent rule group.
   * @returns The FormArray of rules.
   */
  rules(groupIndex: number): FormArray {
    return this.ruleGroups.at(groupIndex).get('rules') as FormArray;
  }

  /**
   * Adds a new, empty rule to a specific rule group.
   * @param groupIndex The index of the rule group to add the rule to.
   */
  addRule(groupIndex: number) {
    this.rules(groupIndex).push(this.createRule());
  }

  /**
   * Removes a rule from a specific rule group.
   * @param groupIndex The index of the parent rule group.
   * @param ruleIndex The index of the rule to remove.
   */
  removeRule(groupIndex: number, ruleIndex: number) {
    this.rules(groupIndex).removeAt(ruleIndex);
  }

  /** Navigates back to the main segments list page. */
  cancel() {
    this.router.navigate(['/map/prospect-segments']);
  }

  /**
   * Gathers the form data, constructs a segment object, and saves it
   * via the SegmentService before navigating back to the list page.
   */
  saveSegment() {
    const formValue = this.segmentForm.value;
    const rulesCount = formValue.ruleGroups?.reduce((acc, group) => acc + (group.rules?.length || 0), 0) || 0;

    const segmentData: Partial<ProspectSegment> = {
      id: this.segmentId() || undefined,
      name: formValue.segmentName || 'Untitled Segment',
      description: formValue.description || '',
      rulesCount: rulesCount,
      ruleGroups: formValue.ruleGroups as any,
    };

    this.segmentService.saveSegment(segmentData).then(() => {
      this.router.navigate(['/map/prospect-segments']);
    });
  }
}
