import { ChangeDetectionStrategy, Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EventService } from '../../../services/event.service';
import { Event, EventStatus, EventType } from '../../../types';

@Component({
  selector: 'app-all-events',
  imports: [CommonModule, RouterModule],
  templateUrl: './all-events.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AllEventsComponent {
  private eventService = inject(EventService);

  readonly events = signal<Event[]>([]);
  readonly isLoading = signal(true);
  readonly activeDropdown = signal<string | null>(null);

  readonly statusFilter = signal<'all' | EventStatus>('all');
  readonly typeFilter = signal<'all' | EventType>('all');

  readonly eventStatuses: EventStatus[] = ['scheduled', 'active', 'finished'];
  readonly eventTypes: EventType[] = ['webinar', 'conference', 'meetup', 'workshop'];

  constructor() {
    this.loadEvents();
  }

  async loadEvents() {
    this.isLoading.set(true);
    const data = await this.eventService.getEvents();
    this.events.set(data);
    this.isLoading.set(false);
  }

  readonly filteredEvents = computed(() => {
    const status = this.statusFilter();
    const type = this.typeFilter();
    return this.events().filter(event => {
      const statusMatch = status === 'all' || event.status === status;
      const typeMatch = type === 'all' || event.type === type;
      return statusMatch && typeMatch;
    });
  });

  toggleDropdown(eventId: string): void {
    this.activeDropdown.update(current => (current === eventId ? null : eventId));
  }

  getStatusClass(status: EventStatus) {
    switch (status) {
      case 'scheduled': return 'bg-sky-100 text-sky-800';
      case 'active': return 'bg-green-100 text-green-800 animate-pulse';
      case 'finished': return 'bg-gray-200 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getTypeClass(type: EventType) {
    switch (type) {
      case 'webinar': return 'bg-blue-100 text-blue-800';
      case 'conference': return 'bg-purple-100 text-purple-800';
      case 'meetup': return 'bg-orange-100 text-orange-800';
      case 'workshop': return 'bg-teal-100 text-teal-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}