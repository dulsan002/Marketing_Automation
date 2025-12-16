import { ChangeDetectionStrategy, Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LineChartComponent } from '../../../components/charts/line-chart.component';
import { BarChartComponent } from '../../../components/charts/bar-chart.component';
import { MOCK_ANALYTICS_KPIS, MOCK_ENGAGEMENT_TRENDS, MOCK_CAMPAIGN_PERFORMANCE, MOCK_CONVERSION_FUNNEL } from '../../../data/mock-data';
import { FunnelChartComponent } from '../../../components/charts/funnel-chart.component';
import { CampaignService } from '../../../services/campaign.service';
import { Campaign } from '../../../types';

@Component({
  selector: 'app-map-analytics',
  imports: [CommonModule, LineChartComponent, BarChartComponent, FunnelChartComponent],
  templateUrl: './analytics.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsComponent {
  private campaignService = inject(CampaignService);

  readonly kpis = signal(MOCK_ANALYTICS_KPIS);
  readonly engagementTrends = signal(MOCK_ENGAGEMENT_TRENDS);
  readonly campaignPerformance = signal(MOCK_CAMPAIGN_PERFORMANCE);
  readonly funnelData = signal(MOCK_CONVERSION_FUNNEL);
  readonly dateRange = signal('30');

  private allCampaigns = this.campaignService.getCampaigns();
  readonly topCampaigns = computed(() => {
    return this.allCampaigns()
        .filter(c => c.status === 'completed' || c.status === 'active')
        .sort((a, b) => b.ctr - a.ctr)
        .slice(0, 5);
  });
  
  onDateRangeChange(event: Event) {
    this.dateRange.set((event.target as HTMLSelectElement).value);
    // In a real app, this would trigger a data refetch.
    console.log('Date range changed to:', this.dateRange());
  }

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
