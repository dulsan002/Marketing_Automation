import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AccountService } from '../../../services/account.service';
import { AccountAnalytics } from '../../../types';
import { PieChartComponent } from '../../../components/charts/pie-chart.component';

@Component({
  selector: 'app-abm-analytics',
  imports: [CommonModule, RouterModule, PieChartComponent],
  templateUrl: './analytics.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsComponent {
  private accountService = inject(AccountService);
  
  readonly analytics = signal<AccountAnalytics | null>(null);
  readonly isLoading = signal(true);

  readonly tierChartData = signal<{ name: string; value: number; color: string }[]>([]);

  constructor() {
    this.loadAnalytics();
  }
  
  async loadAnalytics() {
    this.isLoading.set(true);
    const data = await this.accountService.getAnalytics();
    this.analytics.set(data);
    this.prepareChartData(data);
    this.isLoading.set(false);
  }

  prepareChartData(data: AccountAnalytics) {
    const colorMap = { 'T1': '#3b82f6', 'T2': '#8b5cf6', 'T3': '#f97316' };
    const chartData = data.accountTiers.map(tier => ({
      name: tier.tier,
      value: tier.count,
      color: colorMap[tier.tier]
    }));
    this.tierChartData.set(chartData);
  }

  getTierClass(tier: 'T1' | 'T2' | 'T3'): string {
    switch (tier) {
      case 'T1': return 'bg-blue-100 text-blue-800';
      case 'T2': return 'bg-purple-100 text-purple-800';
      case 'T3': return 'bg-orange-100 text-orange-800';
    }
  }
}