import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EventService } from '../../../services/event.service';
import { Event, Registration, EventStatus, EventType, RegistrationStatus, AttendanceStatus } from '../../../types';

type EventDetailTab = 'overview' | 'registrations' | 'attendance' | 'analytics' | 'automation';

@Component({
  selector: 'app-event-detail',
  imports: [CommonModule, RouterModule],
  templateUrl: './event-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private eventService = inject(EventService);

  readonly event = signal<Event | null>(null);
  readonly registrations = signal<Registration[]>([]);
  readonly isLoading = signal(true);
  readonly activeTab = signal<EventDetailTab>('overview');

  constructor() {
    this.loadEventData();
  }

  async loadEventData() {
    this.isLoading.set(true);
    const eventId = this.route.snapshot.paramMap.get('id');
    if (!eventId) {
      this.goBack();
      return;
    }
    const [eventData, allRegistrations] = await Promise.all([
      this.eventService.getEvent(eventId),
      this.eventService.getRegistrations()
    ]);

    if (!eventData) {
      this.goBack();
      return;
    }

    this.event.set(eventData);
    this.registrations.set(allRegistrations.filter(r => r.eventId === eventId));
    this.isLoading.set(false);
  }

  setTab(tab: EventDetailTab) {
    this.activeTab.set(tab);
  }

  goBack() {
    this.router.navigate(['/events/all']);
  }

  // UI Helper methods
  getStatusClass(status: EventStatus) {
    switch (status) {
      case 'upcoming': return 'bg-sky-100 text-sky-800';
      case 'live': return 'bg-green-100 text-green-800 animate-pulse';
      case 'completed': return 'bg-gray-200 text-gray-800';
    }
  }
  
  getRegistrationStatusClass(status: RegistrationStatus): string {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
    }
  }
  
  getAttendanceStatusClass(status: AttendanceStatus): string {
    switch(status) {
        case 'attended': return 'bg-green-100 text-green-800';
        case 'no-show': return 'bg-red-100 text-red-800';
        case 'partial': return 'bg-yellow-100 text-yellow-800';
    }
  }
}