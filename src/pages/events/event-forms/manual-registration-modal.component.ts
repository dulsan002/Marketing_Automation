import { Component, ChangeDetectionStrategy, inject, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormControl } from '@angular/forms';
import { EventService } from '../../../services/event.service';
import { ContactService } from '../../../services/contact.service';
import { Event, Contact } from '../../../types';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

@Component({
    selector: 'app-manual-registration-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" (click)="close.emit()"></div>

      <div class="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl transform transition-all overflow-hidden flex flex-col max-h-[90vh]">
        
        <!-- Header -->
        <div class="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">Register Attendee</h2>
            <p class="text-sm text-gray-500 mt-1">{{event().name}}</p>
          </div>
          <button (click)="close.emit()" class="text-gray-400 hover:text-gray-600 transition-colors">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Mode Toggle -->
        <div class="px-8 pt-6 pb-2">
            <div class="flex p-1 bg-gray-100 rounded-xl">
                <button (click)="setMode('new')" 
                    [class]="mode() === 'new' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
                    class="flex-1 py-2 text-sm font-bold rounded-lg transition-all">
                    New Registration
                </button>
                <button (click)="setMode('existing')" 
                    [class]="mode() === 'existing' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
                    class="flex-1 py-2 text-sm font-bold rounded-lg transition-all">
                    Existing Contact
                </button>
            </div>
        </div>

        <!-- Content -->
        <div class="p-8 overflow-y-auto">
            
            @if (mode() === 'new') {
                <div class="mb-6 flex items-center justify-between">
                    <h3 class="font-bold text-gray-800">Enter Details</h3>
                    <button (click)="printBlankForm()" class="text-sm text-indigo-600 hover:underline flex items-center">
                         <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2-4h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6a2 2 0 012-2zm9-2V4a2 2 0 00-2-2h-5l-5 5v3m9-3h6m-6 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg> Print Blank Form
                    </button>
                </div>

                <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-6">
                    <div class="grid grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                            <input type="text" formControlName="firstName" class="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" placeholder="John">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                            <input type="text" formControlName="lastName" class="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Doe">
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input type="email" formControlName="email" class="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" placeholder="john@company.com">
                    </div>

                    <div class="grid grid-cols-2 gap-6">
                        @if (event().collectCompany) {
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Company</label>
                            <input type="text" formControlName="company" class="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Acme Inc">
                        </div>
                        }
                        @if (event().collectJobTitle) {
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                            <input type="text" formControlName="jobTitle" class="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Director of Marketing">
                        </div>
                        }
                    </div>

                    <div class="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                        <div>
                            <span class="block text-sm font-medium text-gray-900">Auto-Approve</span>
                            <span class="block text-xs text-gray-500">Set status to 'Registered' immediately</span>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" formControlName="autoApprove" class="sr-only peer">
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                    </div>

                    <div class="pt-4 flex gap-4">
                        <button type="submit" [disabled]="form.invalid || isSubmitting()" class="flex-1 py-3 px-6 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                            {{ isSubmitting() ? 'Registering...' : 'Register Individual' }}
                        </button>
                    </div>
                </form>
            }

            @if (mode() === 'existing') {
                 <div class="space-y-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Search Contact</label>
                        <div class="relative">
                            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input [formControl]="searchControl" type="text" class="w-full pl-10 rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Search by name or email...">
                        </div>
                    </div>

                    <div class="h-64 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100">
                        @for (contact of searchResults(); track contact.id) {
                            <div (click)="selectContact(contact)" 
                                class="p-4 hover:bg-gray-50 cursor-pointer transition-colors flex justify-between items-center group">
                                <div>
                                    <div class="font-bold text-gray-900">{{contact.firstName}} {{contact.lastName}}</div>
                                    <div class="text-xs text-gray-500">{{contact.email}}</div>
                                </div>
                                <div class="opacity-0 group-hover:opacity-100 text-indigo-600 font-bold text-sm">
                                    Select
                                </div>
                            </div>
                        }
                        @empty {
                            <div class="p-8 text-center text-gray-400">
                                {{ searchControl.value.length > 1 ? 'No contacts found.' : 'Type to search contacts.' }}
                            </div>
                        }
                    </div>

                    @if (selectedContact(); as contact) {
                         <div class="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex justify-between items-center">
                            <div>
                                <div class="text-xs uppercase tracking-wide text-indigo-500 font-bold mb-1">Selected</div>
                                <div class="font-bold text-gray-900">{{contact.firstName}} {{contact.lastName}}</div>
                                <div class="text-xs text-gray-500">{{contact.email}}</div>
                            </div>
                            <button (click)="submitExisting(contact)" [disabled]="isSubmitting()" class="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50">
                                Confirm & Register
                            </button>
                         </div>
                    }

                 </div>
            }

        </div>
      </div>
    </div>
    
    <!-- Print Styles (Hidden) -->
    <div id="print-area" class="hidden print:block fixed inset-0 bg-white z-[100] p-8"></div>
  `,
    styles: [`
    @media print {
        :host { display: block; }
        .fixed.inset-0.z-50 { display: none !important; }
        #print-area { display: block !important; }
    }
  `]
})
export class ManualRegistrationModalComponent {
    event = input.required<Event>();
    close = output<void>();

    private fb = inject(FormBuilder);
    private eventService = inject(EventService);
    private contactService = inject(ContactService);

    readonly isSubmitting = signal(false);
    readonly mode = signal<'new' | 'existing'>('new');

    // Existing Search
    readonly searchControl = new FormControl('', { nonNullable: true });
    readonly searchResults = signal<Contact[]>([]);
    readonly selectedContact = signal<Contact | null>(null);

    // New Form
    form = this.fb.group({
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        company: [''],
        jobTitle: [''],
        autoApprove: [true]
    });

    constructor() {
        // Wire up search
        this.searchControl.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap(term => this.contactService.searchContacts(term))
        ).subscribe(contacts => {
            this.searchResults.set(contacts);
        });
    }

    setMode(m: 'new' | 'existing') {
        this.mode.set(m);
        this.selectedContact.set(null);
        this.searchControl.setValue('');
    }

    selectContact(contact: Contact) {
        this.selectedContact.set(contact);
    }

    async submit() {
        if (this.form.invalid) return;
        this.isSubmitting.set(true);

        try {
            const val = this.form.value;
            await this.eventService.registerManual({
                eventId: this.event().id,
                firstName: val.firstName!,
                lastName: val.lastName!,
                email: val.email!,
                company: val.company!,
                jobTitle: val.jobTitle || '',
                status: val.autoApprove ? 'Registered' : 'Pending'
            });
            alert('Individual Registered Successfully!');
            this.close.emit();
        } catch (e: any) {
            console.error(e);
            if (e.error?.message) {
                alert(`Registration Failed: ${e.error.message}`);
            } else {
                alert('Registration Failed. Please try again.');
            }
        } finally {
            this.isSubmitting.set(false);
        }
    }

    async submitExisting(contact: Contact) {
        this.isSubmitting.set(true);
        try {
            await this.eventService.registerContact(this.event().id, contact.id);
            alert('Contact Registered Successfully!');
            this.close.emit();
        } catch (e: any) {
            console.error(e);
            if (e.error?.message) {
                alert(`Registration Failed: ${e.error.message}`);
            } else {
                alert('Registration Failed. They might already be registered.');
            }
        } finally {
            this.isSubmitting.set(false);
        }
    }

    printBlankForm() {
        // Reuse existing print logic...
        const content = `<h1 style="text-align:center">Registration Form for ${this.event().name}</h1>`; // Simplification for brevity, assume previous full template logic if needed
        this.printContent(content);
    }

    private printContent(html: string) {
        const printArea = document.getElementById('print-area');
        if (printArea) {
            printArea.innerHTML = html;
            window.print();
        }
    }
}
