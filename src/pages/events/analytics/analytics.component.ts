import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BarChartComponent } from '../../../components/charts/bar-chart.component';
import { EventService } from '../../../services/event.service';
import { EventAnalytics } from '../../../types';

/**
 * Displays the analytics dashboard for the Events module.
 * This component visualizes key event metrics, including KPIs and
 * a bar chart comparing registrations to attendees for each event.
 */
@Component({
  selector: 'app-events-analytics',
  imports: [CommonModule, BarChartComponent],
  templateUrl: './analytics.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventsAnalyticsComponent {
  private eventService = inject(EventService);

  /** Signal holding the main analytics data object for the Events module. */
  readonly analytics = signal<EventAnalytics | null>(null);
  /** Indicates whether the component is currently fetching analytics data. */
  readonly isLoading = signal(true);
  /** Signal holding the formatted data ready for the bar chart component. */
  readonly chartData = signal<any[]>([]);

  constructor() {
    this.loadAnalytics();
  }

  /**
   * Fetches the event analytics data from the service and prepares it for visualization.
   */
  async loadAnalytics() {
    this.isLoading.set(true);
    const data = await this.eventService.getAnalytics();
    this.analytics.set(data);
    this.prepareChartData(data);
    this.isLoading.set(false);
  }

  /**
   * Transforms the raw analytics data into a format suitable for the bar chart component.
   * It also handles formatting of long event names to prevent label overlap in the chart.
   * @param data The raw analytics data from the service.
   */
  private prepareChartData(data: EventAnalytics) {
    const formattedData = data.attendanceByEvent.map(event => ({
      name: event.eventName.replace(/\s/g, '\n'), // Handle long names for D3 labels
      Registrations: event.registrations,
      Attendees: event.attendees,
    }));
    this.chartData.set(formattedData);
  }
}
