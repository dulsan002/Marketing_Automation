import { ChangeDetectionStrategy, Component, signal, inject, computed } from '@angular/core';
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
  /** Controls visibility of the Registrations series in the chart. */
  readonly showRegistrations = signal(true);
  /** Controls visibility of the Attendees series in the chart. */
  readonly showAttendees = signal(true);
  readonly chartLegend = signal<{ label: string; color: string }[]>([
    { label: 'Registrations', color: '#3b82f6' },
    { label: 'Attendees', color: '#10b981' }
  ]);

  constructor() {
    this.loadAnalytics();
  }

  /**
   * Fetches the event analytics data from the service.
   */
  async loadAnalytics() {
    this.isLoading.set(true);
    const data = await this.eventService.getAnalytics();
    this.analytics.set(data);
    this.isLoading.set(false);
  }

  /** Computed signal that prepares the chart data based on loaded analytics and active filters. */
  readonly chartData = computed(() => {
    const data = this.analytics();
    if (!data) return [];

    // 1. Sort by Date Descending (Newest first)
    const sortedEvents = [...data.attendanceByEvent].sort((a, b) => {
      const dateA = new Date(a.startDate || 0).getTime();
      const dateB = new Date(b.startDate || 0).getTime();
      return dateB - dateA;
    });

    // 2. Take top 8 (Last 8 events)
    const recentEvents = sortedEvents.slice(0, 8);

    // 3. Sort Ascending for Display (Oldest -> Newest left to right)
    const displayEvents = recentEvents.sort((a, b) => {
      const dateA = new Date(a.startDate || 0).getTime();
      const dateB = new Date(b.startDate || 0).getTime();
      return dateA - dateB;
    });

    // 4. Transform for Chart
    const formattedData: any[] = [];
    displayEvents.forEach(event => {
      if (this.showRegistrations()) {
        formattedData.push({
          group: event.eventName,
          name: 'Registrations',
          value: event.registrations,
          color: '#3b82f6' // Blue
        });
      }

      if (this.showAttendees()) {
        formattedData.push({
          group: event.eventName,
          name: 'Attendees',
          value: event.attendees,
          color: '#10b981' // Emerald
        });
      }
    });

    return formattedData;
  });

  toggleRegistrations() {
    this.showRegistrations.update(v => !v);
  }

  toggleAttendees() {
    this.showAttendees.update(v => !v);
  }
}
