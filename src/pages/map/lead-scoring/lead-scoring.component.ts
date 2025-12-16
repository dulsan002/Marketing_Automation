import { ChangeDetectionStrategy, Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DonutChartComponent } from '../../../components/charts/donut-chart.component';
import { MOCK_SCORE_DISTRIBUTION, MOCK_SCORING_RULES, MOCK_TOP_LEADS } from '../../../data/mock-data';
import { ScoringRule } from '../../../types';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';

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


@Component({
  selector: 'app-lead-scoring',
  imports: [CommonModule, DonutChartComponent, ReactiveFormsModule],
  templateUrl: './lead-scoring.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeadScoringComponent {
  private fb = inject(FormBuilder);

  readonly scoreDistribution = signal(MOCK_SCORE_DISTRIBUTION);
  readonly scoringRules = signal<ScoringRule[]>(MOCK_SCORING_RULES);
  readonly topLeads = signal(MOCK_TOP_LEADS);

  readonly isAddingRule = signal(false);
  readonly editingRuleId = signal<string | null>(null);

  readonly availableActions = computed(() => {
    const usedActions = this.scoringRules().map(r => r.name);
    return ALL_SCORING_ACTIONS.filter(action => !usedActions.includes(action));
  });

  readonly availableActionsForEdit = computed(() => {
    const editingRule = this.scoringRules().find(r => r.id === this.editingRuleId());
    const usedActionsByOthers = this.scoringRules()
      .filter(r => r.id !== this.editingRuleId())
      .map(r => r.name);
    
    return ALL_SCORING_ACTIONS.filter(action => 
      action === editingRule?.name || !usedActionsByOthers.includes(action)
    );
  });

  ruleForm = this.fb.group({
    name: ['', Validators.required],
    score: [10, [Validators.required, Validators.min(1)]],
  });

  startAddingRule(): void {
    this.isAddingRule.set(true);
    this.editingRuleId.set(null);
    this.ruleForm.reset({ name: this.availableActions()[0] || '', score: 10 });
  }

  cancelAddRule(): void {
    this.isAddingRule.set(false);
    this.ruleForm.reset();
  }

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

  deleteRule(ruleId: string): void {
    this.scoringRules.update(rules => rules.filter(rule => rule.id !== ruleId));
  }
  
  startEditingRule(rule: ScoringRule): void {
    this.editingRuleId.set(rule.id);
    this.isAddingRule.set(false);
    this.ruleForm.setValue({ name: rule.name, score: rule.score });
  }

  cancelEditRule(): void {
    this.editingRuleId.set(null);
    this.ruleForm.reset();
  }

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