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
  printBadge(reg: Registration): void {
    const badgeWindow = window.open('', '_blank', 'width=400,height=600');
    if (badgeWindow) {
      badgeWindow.document.write(`
        <html>
          <head>
            <title>Badge - ${reg.registrant.name}</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
            <style>
              body { 
                font-family: 'Inter', sans-serif; 
                margin: 0; 
                padding: 0; 
                height: 100vh; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                background:white; 
              }
              .badge { 
                width: 300px; 
                height: 450px; 
                border: 1px solid #000; 
                border-radius: 12px; 
                overflow: hidden; 
                display: flex; 
                flex-direction: column; 
                position: relative; 
              }
              .header { 
                background: black; 
                color: white; 
                padding: 24px; 
                text-align: center; 
              }
              .event-name { font-size: 18px; font-weight: 600; line-height: 1.2;}
              .content { 
                flex: 1; 
                padding: 32px 24px; 
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                justify-content: center;
              }
              .name { 
                font-size: 28px; 
                font-weight: 700; 
                color: #000; 
                text-align: center; 
                margin-bottom: 8px; 
                line-height: 1.1; 
              }
              .company { 
                font-size: 18px; 
                color: #555; 
                margin-bottom: 40px; 
                font-weight: 500; 
                text-align: center; 
              }
              .qr-box { 
                width: 140px; 
                height: 140px; 
                background: #f0f0f0; 
                border: 0px solid #000; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                margin-bottom: 24px;
              }
              .role-tag { 
                border: 2px solid #000; 
                padding: 4px 16px; 
                font-weight: 700; 
                font-size: 14px; 
                text-transform: uppercase; 
                border-radius: 99px;
              }
              .footer { 
                text-align: center; 
                padding: 12px; 
                font-size: 10px; 
                text-transform: uppercase; 
                letter-spacing: 1px; 
                border-top: 1px solid #eee;
              }
              @page { size: 4in 6in; margin: 0; }
            </style>
          </head>
          <body>
            <div class="badge">
              <div class="header">
                 <div class="event-name">${reg.eventName}</div>
              </div>
              <div class="content">
                <div class="name">${reg.registrant.name}</div>
                <div class="company">${reg.company}</div>
                <div class="qr-box">
                  <!-- Mock QR -->
                  <svg width="100" height="100" viewBox="0 0 24 24" fill="black"><path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm8 4h2v2h-2v-2zm-2 2h2v2h-2v-2zm4 0h2v2h-2v-2zm2 2h2v2h-2v-2zM19 13h-2v2h2v-2zm-4 4h2v2h-2v-2zm-6-8h2v2H9V9zm-2 2h2v2H7v-2zm6-2h2v2h-2V9zM7 7h2v2H7V7zm8 0h2v2h-2V7z"/></svg>
                </div>
                <div class="role-tag">${reg.status}</div>
              </div>
              <div class="footer">VISITOR PASS</div>
            </div>
            <script>
              setTimeout(() => { window.print(); window.close(); }, 500);
            </script>
          </body>
        </html>
      `);
      badgeWindow.document.close();
    }
  }
}
