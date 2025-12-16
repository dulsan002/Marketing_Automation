import { ChangeDetectionStrategy, Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormArray, FormGroup } from '@angular/forms';
import { SegmentService } from '../../../../services/segment.service';
import { MOCK_SAMPLE_CONTACTS } from '../../../../data/mock-data';
import { ProspectSegment, SampleContact, SegmentRuleGroup } from '../../../../types';

@Component({
  selector: 'app-new-segment',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './new-segment.component.html',
  styleUrls: ['./new-segment.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewSegmentComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private segmentService = inject(SegmentService);

  readonly segmentId = signal<string | null>(null);
  readonly sampleMatches = signal<SampleContact[]>(MOCK_SAMPLE_CONTACTS);
  readonly isEditMode = computed(() => this.segmentId() !== null);
  
  readonly fields = [
    'Email', 
    'First Name', 
    'Last Name', 
    'Company', 
    'Job Title', 
    'Country', 
    'Created Date', 
    'Last Purchase Date', 
    'Total Spent', 
    'Order Count', 
    'Email Opened'
  ];
  readonly operators = [
    'equals', 
    'does not equal', 
    'contains', 
    'does not contain', 
    'starts with', 
    'ends with', 
    'is greater than', 
    'is less than', 
    'is set', 
    'is not set', 
    'in the last'
  ];

  segmentForm = this.fb.group({
    segmentName: [''],
    description: [''],
    ruleGroups: this.fb.array([this.createRuleGroup()])
  });

  constructor() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.segmentId.set(id);
        const segment = this.segmentService.getSegment(id);
        if (segment) {
          this.patchForm(segment);
        }
      }
    });
  }

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

  get ruleGroups() {
    return this.segmentForm.get('ruleGroups') as FormArray;
  }

  createRuleGroup(group?: SegmentRuleGroup): FormGroup {
    const rules = group?.rules.map(rule => this.createRule(rule)) || [this.createRule()];
    return this.fb.group({
      condition: [group?.condition || 'AND'],
      rules: this.fb.array(rules)
    });
  }

  createRule(rule?: { field: string, operator: string, value: string }): FormGroup {
    return this.fb.group({
      field: [rule?.field || this.fields[0]],
      operator: [rule?.operator || this.operators[0]],
      value: [rule?.value || '']
    });
  }

  addRuleGroup() {
    this.ruleGroups.push(this.createRuleGroup());
  }

  removeRuleGroup(index: number) {
    this.ruleGroups.removeAt(index);
  }

  rules(groupIndex: number): FormArray {
    return this.ruleGroups.at(groupIndex).get('rules') as FormArray;
  }

  addRule(groupIndex: number) {
    this.rules(groupIndex).push(this.createRule());
  }

  removeRule(groupIndex: number, ruleIndex: number) {
    this.rules(groupIndex).removeAt(ruleIndex);
  }

  cancel() {
    this.router.navigate(['/map/prospect-segments']);
  }

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
    
    this.segmentService.saveSegment(segmentData);
    this.router.navigate(['/map/prospect-segments']);
  }
}
