import { ChangeDetectionStrategy, Component, signal, inject, computed, ChangeDetectorRef } from '@angular/core';
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
  private cdr = inject(ChangeDetectorRef);

  /** The ID of the segment being edited, or null if creating a new one. */
  readonly segmentId = signal<string | null>(null);
  /** A list of sample contacts to show in the preview panel. */
  readonly sampleMatches = signal<SampleContact[]>(MOCK_SAMPLE_CONTACTS);
  /** A computed signal that returns true if the component is in edit mode. */
  readonly isEditMode = computed(() => this.segmentId() !== null);

  /** Centralized Field Mapping (Frontend Label <-> Backend Key) */
  private readonly FIELD_MAP: Record<string, string> = {
    'Email': 'email',
    'First Name': 'firstName',
    'Last Name': 'lastName',
    'Company': 'company',
    'Job Title': 'jobTitle',
    'Country': 'country',
    'Created Date': 'createdAt',
    'Last Purchase Date': 'lastPurchaseDate',
    'Total Spent': 'totalSpent',
    'Order Count': 'orderCount',
    'Email Opened': 'emailOpened'
  };

  /** The list of available fields for creating segment rules. */
  readonly fields = Object.keys(this.FIELD_MAP);

  /** Centralized Operator Mapping (Frontend Label <-> Backend Key) */
  private readonly OPERATOR_MAP: Record<string, string> = {
    'equals': 'equals',
    'does not equal': 'not_equals',
    'contains': 'contains',
    'does not contain': 'not_contains',
    'starts with': 'starts_with',
    'ends with': 'ends_with',
    'is greater than': 'gt',
    'is less than': 'lt',
    'is set': 'is_not_empty',
    'is not set': 'is_empty',
    'in the last': 'in_the_last' // TODO: Backend support
  };

  /** The list of available operators for creating segment rules. */
  readonly operators = Object.keys(this.OPERATOR_MAP);

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
          this.cdr.markForCheck(); // Ensure UI updates after async load
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
    this.cdr.markForCheck();
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
      field: [rule ? this.mapBackendFieldToFrontend(rule.field) : this.fields[0]],
      operator: [rule ? this.mapBackendOperatorToFrontend(rule.operator) : this.operators[0]],
      value: [rule?.value || '']
    });
  }

  /** Adds a new, empty rule group to the form. */
  addRuleGroup() {
    this.ruleGroups.push(this.createRuleGroup());
    this.cdr.markForCheck();
  }

  /**
   * Removes a rule group from the form at a specific index.
   * @param index The index of the rule group to remove.
   */
  removeRuleGroup(index: number) {
    this.ruleGroups.removeAt(index);
    this.cdr.markForCheck();
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
    this.cdr.markForCheck();
  }

  /**
   * Removes a rule from a specific rule group.
   * @param groupIndex The index of the parent rule group.
   * @param ruleIndex The index of the rule to remove.
   */
  removeRule(groupIndex: number, ruleIndex: number) {
    this.rules(groupIndex).removeAt(ruleIndex);
    this.cdr.markForCheck();
  }

  /** Navigates back to the main segments list page. */
  cancel() {
    this.router.navigate(['/map/prospect-segments']);
  }

  /**
   * Calculates the estimated size of the segment based on current rules.
   */
  async calculateSize() {
    const formValue = this.segmentForm.value;
    const mappedGroups = (formValue.ruleGroups as any[]).map(group => ({
      condition: group.condition,
      rules: group.rules.map((r: any) => ({
        field: this.mapFrontendFieldToBackend(r.field),
        operator: this.mapFrontendOperatorToBackend(r.operator),
        value: r.value
      }))
    }));

    // Call service
    const { count, samples } = await this.segmentService.previewSegment(mappedGroups);

    this.estimatedSize.set(count);

    // Transform backend sample to frontend SampleContact
    const mappedSamples = samples.map((s: any) => ({
      name: `${s.firstName} ${s.lastName}`,
      email: s.email,
      avatarInitial: (s.firstName || 'C').charAt(0).toUpperCase()
    }));
    this.sampleMatches.set(mappedSamples);
    this.cdr.markForCheck();
  }

  readonly estimatedSize = signal(0);

  // -- Helpers --

  private mapFrontendFieldToBackend(frontendField: string): string {
    return this.FIELD_MAP[frontendField] || frontendField;
  }

  private mapBackendFieldToFrontend(backendField: string): string {
    // Reverse lookup
    return Object.keys(this.FIELD_MAP).find(key => this.FIELD_MAP[key] === backendField) || backendField;
  }

  private mapFrontendOperatorToBackend(frontendOp: string): string {
    return this.OPERATOR_MAP[frontendOp] || 'equals';
  }

  private mapBackendOperatorToFrontend(backendOp: string): string {
    // Reverse lookup
    return Object.keys(this.OPERATOR_MAP).find(key => this.OPERATOR_MAP[key] === backendOp) || 'equals';
  }

  /**
   * Gathers the form data, constructs a segment object, and saves it
   * via the SegmentService before navigating back to the list page.
   */
  saveSegment() {
    const formValue = this.segmentForm.value;
    const rulesCount = formValue.ruleGroups?.reduce((acc, group) => acc + (group.rules?.length || 0), 0) || 0;

    // We need to map the rules here too before saving, OR ensure backend handles the mapping.
    // The current backend implementation expects { field, operator, value } directly from the DB schema JSON structure.
    // Ideally, we save the "UI state" intact or we convert on save.
    // If we convert on save, when we load back, we must convert back.
    // For simplicity now, let's assume we save the RAW UI state (field='First Name') and backend ONLY uses it for evaluation.
    // BUT backend evaluator `query_builder` creates SQL columns. It needs column names.
    // So we MUST map to backend column names ('firstName') for the evaluator to work.
    // Recommendation: Map on Save. When Loading, Map back? Or just store backend format.
    // Let's store Backend Format in the DB.

    // Map existing form groups to backend format
    const backendRuleGroups = (formValue.ruleGroups as any[]).map(group => ({
      condition: group.condition,
      rules: group.rules.map((r: any) => ({
        field: this.mapFrontendFieldToBackend(r.field),
        operator: this.mapFrontendOperatorToBackend(r.operator),
        value: r.value
      }))
    }));

    const segmentData: Partial<ProspectSegment> = {
      id: this.segmentId() || undefined,
      name: formValue.segmentName || 'Untitled Segment',
      description: formValue.description || '',
      rulesCount: rulesCount,
      ruleGroups: backendRuleGroups, // Store usable format
    };

    // Basic Validation: Ensure Name
    if (!segmentData.name?.trim()) {
      alert('Please enter a segment name.');
      return;
    }

    this.segmentService.saveSegment(segmentData).then(() => {
      this.router.navigate(['/map/prospect-segments']);
    });
  }
}
