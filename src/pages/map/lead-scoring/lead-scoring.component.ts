import { ChangeDetectionStrategy, Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DonutChartComponent } from '../../../components/charts/donut-chart.component';
import { MOCK_SCORE_DISTRIBUTION, MOCK_SCORING_RULES, MOCK_TOP_LEADS } from '../../../data/mock-data';
import { ScoringRule } from '../../../types';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';

/** A constant list of all possible actions that can be assigned a score. */
const ALL_SCORING_ACTIONS = [
  'Case Study Viewed',
  'Content Downloaded',
  'Demo Request',
  'Email Clicked',
  'Email Opened',
  'Form Submission',
  'Page Visit',
  'Pricing Page Visit',
  'Webinar Attendance',
  'Webinar Registration',
];

/**
 * Manages the lead scoring dashboard.
 * This component displays lead score distribution, a list of top leads, and allows
 * for the creation, editing, and deletion of scoring rules that assign points for specific actions.
 */
@Component({
  selector: 'app-lead-scoring',
  imports: [CommonModule, DonutChartComponent, ReactiveFormsModule],
  templateUrl: './lead-scoring.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeadScoringComponent {
  private fb = inject(FormBuilder);

  /** Data for the lead score distribution donut chart. */
  readonly scoreDistribution = signal(MOCK_SCORE_DISTRIBUTION);
  /** The list of current scoring rules. */
  readonly scoringRules = signal<ScoringRule[]>(MOCK_SCORING_RULES);
  /** The list of top-scoring leads. */
  readonly topLeads = signal(MOCK_TOP_LEADS);

  /** A flag to control the visibility of the "add new rule" form. */
  readonly isAddingRule = signal(false);
  /** The ID of the rule currently being edited. Null if no rule is in edit mode. */
  readonly editingRuleId = signal<string | null>(null);

  /** A computed property that lists actions not yet used in a scoring rule, available for new rules. */
  readonly availableActions = computed(() => {
    const usedActions = this.scoringRules().map(r => r.name);
    return ALL_SCORING_ACTIONS.filter(action => !usedActions.includes(action));
  });

  /** 
   * A computed property that lists actions available for the rule being edited.
   * This includes the rule's current action and any other unused actions.
   */
  readonly availableActionsForEdit = computed(() => {
    const editingRule = this.scoringRules().find(r => r.id === this.editingRuleId());
    const usedActionsByOthers = this.scoringRules()
      .filter(r => r.id !== this.editingRuleId())
      .map(r => r.name);
    
    return ALL_SCORING_ACTIONS.filter(action => 
      action === editingRule?.name || !usedActionsByOthers.includes(action)
    );
  });

  /** The reactive form for adding or editing a scoring rule. */
  ruleForm = this.fb.group({
    name: ['', Validators.required],
    score: [10, [Validators.required, Validators.min(1)]],
  });

  /** Puts the component into "add rule" mode, showing the form. */
  startAddingRule(): void {
    this.isAddingRule.set(true);
    this.editingRuleId.set(null);
    this.ruleForm.reset({ name: this.availableActions()[0] || '', score: 10 });
  }

  /** Cancels the "add rule" mode, hiding the form. */
  cancelAddRule(): void {
    this.isAddingRule.set(false);
    this.ruleForm.reset();
  }

  /** Saves a new rule if the form is valid and adds it to the list. */
  saveNewRule(): void {
    if (this.ruleForm.valid) {
      const newRule: ScoringRule = {
        id: `rule_${Date.now()}`,
        name: this.ruleForm.value.name!,
        score: this.ruleForm.value.score!,
      };
      this.scoringRules.update(rules => [...rules, newRule].sort((a,b) => a.name.localeCompare(b.name)));
      this.cancelAddRule();
    }
  }

  /** Deletes a rule from the list. */
  deleteRule(ruleId: string): void {
    this.scoringRules.update(rules => rules.filter(rule => rule.id !== ruleId));
  }
  
  /** Puts a specific rule into "edit mode". */
  startEditingRule(rule: ScoringRule): void {
    this.editingRuleId.set(rule.id);
    this.isAddingRule.set(false);
    this.ruleForm.setValue({ name: rule.name, score: rule.score });
  }

  /** Cancels the "edit rule" mode. */
  cancelEditRule(): void {
    this.editingRuleId.set(null);
    this.ruleForm.reset();
  }

  /** Saves the changes to an existing rule if the form is valid. */
  saveRule(ruleId: string): void {
    if (this.ruleForm.valid) {
      const updatedRuleData = this.ruleForm.value;
      this.scoringRules.update(rules =>
        rules.map(rule =>
          rule.id === ruleId
            ? { ...rule, name: updatedRuleData.name!, score: updatedRuleData.score! }
            : rule
        ).sort((a,b) => a.name.localeCompare(b.name))
      );
      this.cancelEditRule();
    }
  }
}
