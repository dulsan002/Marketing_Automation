import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EventService } from '../../../services/event.service';
import { Event as AppEvent } from '../../../types';
import { ManualRegistrationModalComponent } from './manual-registration-modal.component';

@Component({
  selector: 'app-event-forms',
  standalone: true,
  imports: [CommonModule, RouterModule, ManualRegistrationModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8 animate-fade-in-up">
      <!-- Header with Search and Filters -->
      <div class="flex flex-col md:flex-row gap-4 items-start md:items-center justify-start">
        
        <div class="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <!-- Search -->
            <div class="relative w-full sm:w-64">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg class="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input 
                    type="text" 
                    placeholder="Search events..." 
                    (input)="onSearch($event)"
                    class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                >
            </div>

            <!-- Filter -->
            <div class="relative w-full sm:w-48">
                 <select (change)="onTypeFilterChange($event)" class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg">
                    <option value="all">All Types</option>
                    @for (type of eventTypes; track type) {
                        <option [value]="type">{{type}}</option>
                    }
                </select>
            </div>
        </div>
      </div>

      <!-- Events Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (event of filteredEvents(); track event.id) {
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
            @if (searchTerm() || typeFilter() !== 'all') {
                No events match your search criteria.
            } @else {
                No scheduled events found. Create an event to see it here.
            }
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

  readonly sourceEvents = signal<AppEvent[]>([]);
  readonly selectedEvent = signal<AppEvent | null>(null);

  // Filters
  readonly searchTerm = signal('');
  readonly typeFilter = signal('all');
  readonly eventTypes = ['Webinar', 'Conference', 'Workshop', 'Meetup'];

  readonly filteredEvents = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const type = this.typeFilter().toLowerCase();
    const events = this.sourceEvents();

    return events.filter(event => {
      const matchesTerm = event.name.toLowerCase().includes(term);
      const matchesType = type === 'all' || event.type?.toLowerCase() === type;
      return matchesTerm && matchesType;
    });
  });

  constructor() {
    this.loadEvents();
  }

  async loadEvents() {
    const allEvents = await this.eventService.getEvents();
    // Filter for scheduled or active (not finished)
    this.sourceEvents.set(allEvents.filter(e => e.status !== 'finished'));
  }

  openModal(event: AppEvent) {
    this.selectedEvent.set(event);
  }

  closeModal() {
    this.selectedEvent.set(null);
  }

  onSearch(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  onTypeFilterChange(event: Event) {
    this.typeFilter.set((event.target as HTMLSelectElement).value);
  }
}

