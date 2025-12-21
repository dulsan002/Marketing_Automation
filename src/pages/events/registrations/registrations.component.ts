import { ChangeDetectionStrategy, Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EventService } from '../../../services/event.service';
import { Registration, RegistrationStatus, Event as AppEvent } from '../../../types';
import { AddRegistrationModalComponent } from './add-registration-modal.component';
import { BanUserModalComponent } from './ban-user-modal.component';
import { UnbanUserModalComponent } from './unban-user-modal.component';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-registrations',
  imports: [CommonModule, RouterModule, AddRegistrationModalComponent, BanUserModalComponent, UnbanUserModalComponent],
  templateUrl: './registrations.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationsComponent {
  private eventService = inject(EventService);
  public authService = inject(AuthService); // Public for template access if needed

  readonly registrations = signal<Registration[]>([]);
  readonly allEvents = signal<AppEvent[]>([]);
  readonly isLoading = signal(true);
  readonly activeDropdown = signal<string | null>(null);
  readonly isModalOpen = signal(false);
  readonly pendingBanRegistration = signal<Registration | null>(null); // For Ban Modal
  readonly pendingUnbanRegistration = signal<Registration | null>(null); // For Unban Modal

  // Signals for filtering and searching
  readonly searchTerm = signal('');
  readonly statusFilter = signal<'all' | RegistrationStatus>('all');
  readonly eventFilter = signal<'all' | string>('all');
  // NoShow and Attended removed from manual selection as requested
  readonly registrationStatuses: RegistrationStatus[] = ['Registered', 'Pending', 'Confirmed', 'Cancelled', 'Banned'];

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

  // Handler methods
  onSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  onStatusFilterChange(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value as 'all' | RegistrationStatus);
  }

  onEventFilterChange(event: Event): void {
    this.eventFilter.set((event.target as HTMLSelectElement).value);
  }

  toggleDropdown(registrationId: string, eventId: string) {
    if (this.isEventFinished(eventId)) {
      alert("Cannot change status for a completed event.");
      return;
    }
    this.activeDropdown.update(current => (current === registrationId ? null : registrationId));
  }

  isEventFinished(eventId: string): boolean {
    const event = this.allEvents().find(e => e.id === eventId);
    return event?.status === 'finished';
  }

  async handleSaveRegistration(newRegistrationData: Omit<Registration, 'id' | 'status' | 'registeredDate'>) {
    await this.eventService.addRegistration(newRegistrationData);
    this.isModalOpen.set(false);
    this.loadData();
  }

  async changeStatus(registration: Registration, newStatus: RegistrationStatus | 'Unban') {
    this.activeDropdown.set(null);
    if (registration.status === newStatus) return;

    // Prevent changing Banned status directly
    if (registration.status === 'Banned' && newStatus !== 'Unban') {
      alert("This user is Banned. You must Unban them first.");
      return;
    }

    if (newStatus === 'Banned') {
      // Open Modal instead of prompt
      this.pendingBanRegistration.set(registration);
      return;
    }

    if (newStatus === 'Unban') {
      this.pendingUnbanRegistration.set(registration);
      return;
    }

    await this.eventService.updateRegistrationStatus(registration.id, newStatus as RegistrationStatus, registration.eventId);
    this.registrations.update(regs =>
      regs.map(r => r.id === registration.id ? { ...r, status: newStatus as RegistrationStatus } : r)
    );
  }

  async handleBanConfirm(details: { reason: string, adminName: string, adminEmail: string }) {
    const reg = this.pendingBanRegistration();
    if (!reg) return;

    await this.eventService.updateRegistrationStatus(reg.id, 'Banned', reg.eventId, {
      banReason: details.reason,
      adminName: details.adminName,
      adminEmail: details.adminEmail
    });

    this.registrations.update(regs =>
      regs.map(r => r.id === reg.id ? { ...r, status: 'Banned', banReason: details.reason } : r)
    );
    this.pendingBanRegistration.set(null);
  }

  async handleUnbanConfirm(details: { reason: string, adminName: string, adminEmail: string }) {
    const reg = this.pendingUnbanRegistration();
    if (!reg) return;

    // Reset to Registered upon unban
    const newStatus = 'Registered';

    await this.eventService.updateRegistrationStatus(reg.id, newStatus, reg.eventId, {
      banReason: details.reason, // Re-using field for unban reason transmission, or add specific param?
      // Actually, backend needs specific 'Unbanned' handling. I'll overload the options.
      unbanReason: details.reason,
      adminName: details.adminName,
      adminEmail: details.adminEmail,
      isUnban: true
    });

    this.registrations.update(regs =>
      regs.map(r => r.id === reg.id ? { ...r, status: newStatus } : r)
    );
    this.pendingUnbanRegistration.set(null);
  }

  cancelUnban() {
    this.pendingUnbanRegistration.set(null);
  }

  cancelBan() {
    this.pendingBanRegistration.set(null);
  }

  getStatusClass(status: RegistrationStatus): string {
    switch (status) {
      case 'Registered': return 'bg-green-100 text-green-800';
      case 'Confirmed': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'Attended': return 'bg-blue-100 text-blue-800';
      case 'NoShow': return 'bg-gray-100 text-gray-800';
      case 'Banned': return 'bg-gray-800 text-white';
      default: return 'bg-gray-100 text-gray-600';
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
              .event-name { font-size: 24px; font-weight: 700; line-height: 1.2; letter-spacing: -0.5px; }
              .content { 
                flex: 1; 
                padding: 40px 30px; 
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                justify-content: flex-start;
                text-align: center;
              }
              .name { 
                font-size: 32px; 
                font-weight: 800; 
                color: #111; 
                margin-bottom: 8px; 
                line-height: 1.1; 
              }
              .email {
                  font-size: 14px;
                  color: #666;
                  margin-bottom: 24px;
                  font-weight: 500;
              }
              .company { 
                font-size: 20px; 
                color: #444; 
                margin-bottom: auto; 
                font-weight: 600; 
              }
              .qr-box { 
                width: 160px; 
                height: 160px; 
                background: #fff; 
                border: 2px solid #000; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                margin-bottom: 30px;
                border-radius: 12px;
              }
              .role-tag { 
                background: #000;
                color: #fff;
                padding: 6px 20px; 
                font-weight: 700; 
                font-size: 16px; 
                text-transform: uppercase; 
                border-radius: 8px;
                letter-spacing: 1px;
              }
              .footer { 
                text-align: center; 
                padding: 16px; 
                font-size: 11px; 
                text-transform: uppercase; 
                letter-spacing: 2px; 
                border-top: 1px solid #eee;
                font-weight: 600;
                color: #aaa;
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
                <div class="email">${reg.registrant.email}</div>
                <div class="company">${reg.company || ''}</div>
                
                <div style="flex:1"></div>

                <div class="qr-box">
                  <!-- Mock QR -->
                  <svg width="120" height="120" viewBox="0 0 24 24" fill="black"><path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm8 4h2v2h-2v-2zm-2 2h2v2h-2v-2zm4 0h2v2h-2v-2zm2 2h2v2h-2v-2zM19 13h-2v2h2v-2zm-4 4h2v2h-2v-2zm-6-8h2v2H9V9zm-2 2h2v2H7v-2zm6-2h2v2h-2V9zM7 7h2v2H7V7zm8 0h2v2h-2V7z"/></svg>
                </div>
                <div class="role-tag">${reg.status}</div>
              </div>
              <div class="footer">Pass ID: ${reg.id.substring(0, 8)}</div>
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
