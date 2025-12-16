import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AccountService } from '../../../services/account.service';
import { AccountAnalytics } from '../../../types';
import { PieChartComponent } from '../../../components/charts/pie-chart.component';

/**
 * Displays the analytics dashboard for the Account-Based Marketing (ABM) module.
 * This component visualizes key ABM metrics such as account tiers and top-performing accounts.
 */
@Component({
  selector: 'app-abm-analytics',
  imports: [CommonModule, RouterModule, PieChartComponent],
  templateUrl: './analytics.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AbmAnalyticsComponent {
  private accountService = inject(AccountService);
  
  /** Signal holding the main analytics data object for the ABM module. */
  readonly analytics = signal<AccountAnalytics | null>(null);
  /** Indicates whether the component is currently fetching analytics data. */
  readonly isLoading = signal(true);

  /** Signal holding the formatted data ready for the pie chart component. */
  readonly tierChartData = signal<{ name: string; value: number; color: string }[]>([]);

  constructor() {
    this.loadAnalytics();
  }
  
  /**
   * Fetches the ABM analytics data from the service and prepares it for visualization.
   */
  async loadAnalytics() {
    this.isLoading.set(true);
    const data = await this.accountService.getAnalytics();
    this.analytics.set(data);
    this.prepareChartData(data);
    this.isLoading.set(false);
  }

  /**
   * Transforms the raw analytics data for account tiers into a format
   * suitable for the pie chart component, including assigning colors.
   * @param data The raw analytics data from the service.
   */
  prepareChartData(data: AccountAnalytics) {
    const colorMap = { 'T1': '#3b82f6', 'T2': '#8b5cf6', 'T3': '#f97316' };
    const chartData = data.accountTiers.map(tier => ({
      name: tier.tier,
      value: tier.count,
      color: colorMap[tier.tier]
    }));
    this.tierChartData.set(chartData);
  }

  /**
   * Determines the Tailwind CSS classes for an account's tier badge.
   * @param tier The account tier ('T1', 'T2', or 'T3').
   * @returns A string of CSS classes.
   */
  getTierClass(tier: 'T1' | 'T2' | 'T3'): string {
    switch (tier) {
      case 'T1': return 'bg-blue-100 text-blue-800';
      case 'T2': return 'bg-purple-100 text-purple-800';
      case 'T3': return 'bg-orange-100 text-orange-800';
    }
  }
}
