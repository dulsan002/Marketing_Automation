import { ChangeDetectionStrategy, Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EventService } from '../../../services/event.service';
// FIX: Aliased `Event` to `AppEvent` to avoid conflict with the DOM `Event` type.
import { Registration, RegistrationStatus, Event as AppEvent } from '../../../types';
import { AddRegistrationModalComponent } from './add-registration-modal.component';

@Component({
  selector: 'app-registrations',
  imports: [CommonModule, RouterModule, AddRegistrationModalComponent],
  templateUrl: './registrations.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationsComponent {
  private eventService = inject(EventService);

  readonly registrations = signal<Registration[]>([]);
  // FIX: Updated signal type to use the `AppEvent` alias.
  readonly allEvents = signal<AppEvent[]>([]);
  readonly isLoading = signal(true);
  readonly activeDropdown = signal<string | null>(null);
  readonly isModalOpen = signal(false);

  // New signals for filtering and searching
  readonly searchTerm = signal('');
  readonly statusFilter = signal<'all' | RegistrationStatus>('all');
  readonly eventFilter = signal<'all' | string>('all');
  readonly registrationStatuses: RegistrationStatus[] = ['confirmed', 'pending', 'cancelled'];

  constructor() {
    this.loadData();
  }

  async loadData() {
    this.isLoading.set(true);
    const [registrations, events] = await Promise.all([
      this.eventService.getRegistrations(),
      this.eventService.getEvents()
    ]);
    this.registrations.set(registrations);
    this.allEvents.set(events);
    this.isLoading.set(false);
  }

  readonly filteredRegistrations = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const status = this.statusFilter();
    const eventId = this.eventFilter();
    
    return this.registrations().filter(reg => {
      const searchTermMatch = term === '' ||
        reg.registrant.name.toLowerCase().includes(term) ||
        reg.registrant.email.toLowerCase().includes(term) ||
        (reg.company && reg.company.toLowerCase().includes(term));
        
      const statusMatch = status === 'all' || reg.status === status;
      const eventMatch = eventId === 'all' || reg.eventId === eventId;
      
      return searchTermMatch && statusMatch && eventMatch;
    });
  });

  // New handler methods
  onSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  onStatusFilterChange(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value as 'all' | RegistrationStatus);
  }

  onEventFilterChange(event: Event): void {
    this.eventFilter.set((event.target as HTMLSelectElement).value);
  }

  toggleDropdown(registrationId: string) {
    this.activeDropdown.update(current => (current === registrationId ? null : registrationId));
  }

  async handleSaveRegistration(newRegistrationData: Omit<Registration, 'id' | 'status' | 'registeredDate'>) {
    await this.eventService.addRegistration(newRegistrationData);
    this.isModalOpen.set(false);
    this.loadData();
  }

  async changeStatus(registration: Registration, newStatus: RegistrationStatus) {
    this.activeDropdown.set(null);
    if (registration.status === newStatus) return;
    
    await this.eventService.updateRegistrationStatus(registration.id, newStatus);
    this.registrations.update(regs => 
      regs.map(r => r.id === registration.id ? { ...r, status: newStatus } : r)
    );
  }

  getStatusClass(status: RegistrationStatus): string {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
    }
  }
}
