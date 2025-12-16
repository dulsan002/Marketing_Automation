import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BarChartComponent } from '../../../components/charts/bar-chart.component';
import { EventService } from '../../../services/event.service';
import { EventAnalytics } from '../../../types';

@Component({
  selector: 'app-events-analytics',
  imports: [CommonModule, BarChartComponent],
  templateUrl: './analytics.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsComponent {
  private eventService = inject(EventService);

  readonly analytics = signal<EventAnalytics | null>(null);
  readonly isLoading = signal(true);
  readonly chartData = signal<any[]>([]);

  constructor() {
    this.loadAnalytics();
  }

  async loadAnalytics() {
    this.isLoading.set(true);
    const data = await this.eventService.getAnalytics();
    this.analytics.set(data);
    this.prepareChartData(data);
    this.isLoading.set(false);
  }

  private prepareChartData(data: EventAnalytics) {
    const formattedData = data.attendanceByEvent.map(event => ({
      name: event.eventName.replace(/\s/g, '\n'), // Handle long names for D3 labels
      Registrations: event.registrations,
      Attendees: event.attendees,
    }));
    this.chartData.set(formattedData);
  }
}