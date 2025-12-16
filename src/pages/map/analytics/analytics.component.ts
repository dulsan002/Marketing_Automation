import { ChangeDetectionStrategy, Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LineChartComponent } from '../../../components/charts/line-chart.component';
import { BarChartComponent } from '../../../components/charts/bar-chart.component';
import { MOCK_ANALYTICS_KPIS, MOCK_ENGAGEMENT_TRENDS, MOCK_CAMPAIGN_PERFORMANCE, MOCK_CONVERSION_FUNNEL } from '../../../data/mock-data';
import { FunnelChartComponent } from '../../../components/charts/funnel-chart.component';
import { CampaignService } from '../../../services/campaign.service';
import { Campaign } from '../../../types';

/**
 * Displays the analytics dashboard for the Marketing Automation Platform (MAP) module.
 * This component visualizes key marketing metrics, including KPIs, engagement trends,
 * campaign performance, and the lead conversion funnel.
 */
@Component({
  selector: 'app-map-analytics',
  imports: [CommonModule, LineChartComponent, BarChartComponent, FunnelChartComponent],
  templateUrl: './analytics.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapAnalyticsComponent {
  private campaignService = inject(CampaignService);

  /** Signal holding the Key Performance Indicator (KPI) data. */
  readonly kpis = signal(MOCK_ANALYTICS_KPIS);
  /** Signal holding data for the engagement trends line chart. */
  readonly engagementTrends = signal(MOCK_ENGAGEMENT_TRENDS);
  /** Signal holding data for the campaign performance bar chart. */
  readonly campaignPerformance = signal(MOCK_CAMPAIGN_PERFORMANCE);
  /** Signal holding data for the lead conversion funnel chart. */
  readonly funnelData = signal(MOCK_CONVERSION_FUNNEL);
  /** The currently selected date range for filtering analytics. */
  readonly dateRange = signal('30');

  private allCampaigns = this.campaignService.getCampaigns();
  /** A computed signal that derives the top 5 performing campaigns based on Click-Through Rate (CTR). */
  readonly topCampaigns = computed(() => {
    return this.allCampaigns()
        .filter(c => c.status === 'completed' || c.status === 'active')
        .sort((a, b) => b.ctr - a.ctr)
        .slice(0, 5);
  });
  
  /**
   * Updates the date range signal when the user changes the selection.
   * In a real application, this would trigger a refetch of analytics data.
   * @param event The change event from the date range select element.
   */
  onDateRangeChange(event: Event) {
    this.dateRange.set((event.target as HTMLSelectElement).value);
    // In a real app, this would trigger a data refetch.
    console.log('Date range changed to:', this.dateRange());
  }

  /**
   * Determines the Tailwind CSS classes for a campaign's status badge.
   * @param status The status of the campaign.
   * @returns A string of CSS classes.
   */
  getStatusClass(status: Campaign['status']): string {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}
