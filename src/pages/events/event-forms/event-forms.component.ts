import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EventService } from '../../../services/event.service';
import { Event } from '../../../types';
import { ManualRegistrationModalComponent } from './manual-registration-modal.component';

@Component({
    selector: 'app-event-forms',
    standalone: true,
    imports: [CommonModule, RouterModule, ManualRegistrationModalComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="space-y-8 animate-fade-in-up">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 tracking-tight">Event Forms & Badges</h1>
          <p class="text-gray-500 mt-2">Manage manual registrations and print participant badges for upcoming events.</p>
        </div>
      </div>

      <!-- Events Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (event of scheduledEvents(); track event.id) {
          <div (click)="openModal(event)" 
               class="group relative bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden">
            
            <!-- Type Badge -->
            <div class="absolute top-4 right-4">
              <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600">
                {{event.type}}
              </span>
            </div>

            <div class="mb-4">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                 <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                 </svg>
              </div>
            </div>

            <h3 class="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">{{event.name}}</h3>
            
            <div class="space-y-2 text-sm text-gray-600">
              <div class="flex items-center">
                <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {{event.date | date:'mediumDate'}}
              </div>
               <div class="flex items-center">
                <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{event.duration}} mins
              </div>
            </div>

            <div class="mt-6 flex items-center text-indigo-600 font-semibold text-sm opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
              Open Registration Form
              <svg class="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>
        }
        @empty {
          <div class="col-span-full text-center py-12 text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
            No scheduled events found. Create an event to see it here.
          </div>
        }
      </div>

      <!-- Modal -->
      <app-manual-registration-modal 
        *ngIf="selectedEvent()" 
        [event]="selectedEvent()!" 
        (close)="closeModal()"
      ></app-manual-registration-modal>
    </div>
  `
})
export class EventFormsComponent {
    private eventService = inject(EventService);

    // Only show upcoming/scheduled/active events
    readonly scheduledEvents = signal<Event[]>([]);
    readonly selectedEvent = signal<Event | null>(null);

    constructor() {
        this.loadEvents();
    }

    async loadEvents() {
        const allEvents = await this.eventService.getEvents();
        // Filter for scheduled or active (not finished)
        this.scheduledEvents.set(allEvents.filter(e => e.status !== 'finished'));
    }

    openModal(event: Event) {
        this.selectedEvent.set(event);
    }

    closeModal() {
        this.selectedEvent.set(null);
    }
}
