import { ChangeDetectionStrategy, Component, output, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Event, Registration } from '../../../types';

@Component({
  selector: 'app-add-registration-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-60 z-40 transition-opacity" (click)="closeModal()"></div>
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col animate-fade-in-up">
        
        <div class="flex justify-between items-center p-5 border-b border-gray-200">
          <h2 class="text-xl font-bold text-gray-800">New Registration</h2>
          <button (click)="closeModal()" class="text-gray-400 hover:text-gray-600 p-1 rounded-full">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <form [formGroup]="registrationForm" (ngSubmit)="onSave()" class="flex-grow overflow-y-auto">
          <div class="p-6 space-y-6">
            <!-- Name and Email -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg class="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" /></svg>
                  </div>
                  <input type="text" id="name" formControlName="name" class="w-full pl-10 pr-3 py-2 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                </div>
              </div>
              <div>
                <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg class="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" /><path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" /></svg>
                  </div>
                  <input type="email" id="email" formControlName="email" class="w-full pl-10 pr-3 py-2 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                </div>
              </div>
            </div>

            <!-- Company -->
            <div>
              <label for="company" class="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 16.5v-13h12v13h-2v-2.5a.75.75 0 00-1.5 0v2.5h-5v-2.5a.75.75 0 00-1.5 0v2.5H4zM3 3.5a.5.5 0 01.5-.5h13a.5.5 0 01.5.5v13a.5.5 0 01-.5.5h-13a.5.5 0 01-.5-.5v-13z" clip-rule="evenodd" /></svg>
                </div>
                <input type="text" id="company" formControlName="company" class="w-full pl-10 pr-3 py-2 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
              </div>
            </div>
            
            <!-- Event -->
            <div>
              <label for="event" class="block text-sm font-medium text-gray-700 mb-1">Event *</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c0-.414.336-.75.75-.75h10.5a.75.75 0 010 1.5H5.5a.75.75 0 01-.75-.75z" clip-rule="evenodd" /></svg>
                </div>
                <select id="event" formControlName="eventId" class="appearance-none w-full pl-10 pr-10 py-2 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                  <option value="" disabled>Select an event</option>
                  @for(event of events(); track event.id) {
                    <option [value]="event.id">{{ event.name }}</option>
                  }
                </select>
                <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg class="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clip-rule="evenodd" /></svg>
                </div>
              </div>
            </div>
          </div>

          <div class="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button type="button" (click)="closeModal()" class="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200">
                Cancel
              </button>
              <button type="submit" [disabled]="registrationForm.invalid" class="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition duration-200 disabled:bg-indigo-300">
                Save Registration
              </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fade-in-up {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddRegistrationModalComponent {
  private fb = inject(FormBuilder);
  events = input.required<Event[]>();
  save = output<Omit<Registration, 'id' | 'status' | 'registeredDate'>>();
  close = output<void>();

  registrationForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    company: [''],
    eventId: ['', Validators.required],
  });

  closeModal(): void {
    this.close.emit();
  }

  onSave(): void {
    if (this.registrationForm.valid) {
      const { name, email, company, eventId } = this.registrationForm.value;
      const selectedEvent = this.events().find(e => e.id === eventId);
      
      const saveData = {
        registrant: { name: name!, email: email! },
        company: company!,
        eventId: eventId!,
        eventName: selectedEvent?.name || 'Unknown Event'
      };
      this.save.emit(saveData);
    }
  }
}
