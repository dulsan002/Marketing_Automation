import { ChangeDetectionStrategy, Component, signal, inject, computed, DestroyRef } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { EventService } from '../../../services/event.service';
import { Event, EventType } from '../../../types';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-event-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './event-form.component.html',
  styleUrls: ['./event-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventFormComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private eventService = inject(EventService);
  private destroyRef = inject(DestroyRef);

  readonly currentStep = signal(1);
  readonly eventId = signal<string | null>(null);
  readonly isEditMode = computed(() => this.eventId() !== null);

  readonly steps = [
    { number: 1, name: 'Basics', description: 'Event type and details' },
    { number: 2, name: 'Schedule', description: 'Date, time, and duration' },
    { number: 3, name: 'Settings', description: 'Capacity and registration' },
    { number: 4, name: 'Review', description: 'Final check' },
  ];

  readonly eventTypesWithDetails = [
    { id: 'webinar' as EventType, title: 'Webinar', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9A2.25 2.25 0 0013.5 5.25h-9A2.25 2.25 0 002.25 7.5v9A2.25 2.25 0 004.5 18.75z" />' },
    { id: 'conference' as EventType, title: 'Conference', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.928A3 3 0 017.5 15.25m0-4.01a3 3 0 013-3m0 0a3 3 0 013 3m0 0a3 3 0 01-3 3m0 0a3 3 0 01-3-3m2.25 6H12m-2.25-6l-2.25-2.25" />' },
    { id: 'meetup' as EventType, title: 'Meetup', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.76 9.76 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.455.09-.934.09-1.425v-.09c0-.62-.08-1.218-.23-1.798a5.975 5.975 0 01-2.238-4.48c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />' },
    { id: 'workshop' as EventType, title: 'Workshop', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M14.25 6.087c0-.596.484-1.08 1.08-1.08H15a4.5 4.5 0 014.5 4.5v3.313c0 .393-.25.74-.61.886a4.493 4.493 0 01-1.785.441 4.493 4.493 0 01-1.785-.441 1.01 1.01 0 00-.61-.886V10.5a4.5 4.5 0 01-4.5-4.5 4.5 4.5 0 01.087-.913zM6 18.75A3.75 3.75 0 112.25 15a3.74 3.74 0 011.5.313 3.73 3.73 0 011.938 0A3.74 3.74 0 017.5 15a3.75 3.75 0 01-1.5 3.75z" />' }
  ];

  eventForm = this.fb.group({
    basics: this.fb.group({
      name: ['', Validators.required],
      type: ['webinar' as EventType, Validators.required],
      speaker: ['', Validators.required],
      venue: [''], // Venue is optional or required? User said "should be add", assuming optional/required based on type? Let's make optional for now or required if user insists. User said "venue or meeting link should be add". Let's make it required to be safe.
    }),
    schedule: this.fb.group({
      date: ['', [Validators.required, this.futureDateValidator()]],
      time: ['', Validators.required],
      duration: [60, [Validators.required, Validators.min(1)]],
    }),
    settings: this.fb.group({
      capacity: [100, [Validators.required, Validators.min(1)]],
      requiresApproval: [false],
      collectCompany: [true],
      collectJobTitle: [false],
    }),
  });

  private readonly basicsFormValid = signal(this.eventForm.get('basics')!.valid);
  private readonly scheduleFormValid = signal(this.eventForm.get('schedule')!.valid);
  private readonly settingsFormValid = signal(this.eventForm.get('settings')!.valid);

  readonly isStepValid = computed(() => {
    switch (this.currentStep()) {
      case 1: return this.basicsFormValid();
      case 2: return this.scheduleFormValid();
      case 3: return this.settingsFormValid();
      default: return true;
    }
  });

  eventStatus = signal<Event['status']>('scheduled');

  constructor() {
    this.eventForm.get('basics')!.statusChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(status => this.basicsFormValid.set(status === 'VALID'));
    this.eventForm.get('schedule')!.statusChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(status => this.scheduleFormValid.set(status === 'VALID'));
    this.eventForm.get('settings')!.statusChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(status => this.settingsFormValid.set(status === 'VALID'));

    this.route.paramMap.subscribe(async params => {
      const id = params.get('id');
      if (id) {
        this.eventId.set(id);
        const eventData = await this.eventService.getEvent(id);
        if (eventData) {

          // Edit Restriction
          if (eventData.status !== 'scheduled' && eventData.status !== 'active') { // User said "sheduled or upcoming events only". "Active" implies ongoing, might be editable? "Upcoming" maps to "scheduled". User specifically said "only edit sheduled or upcoming". "Active" is live. Usually live events aren't fully editable. But let's stick to "scheduled".
            // Actually user said "sheduled or upcoming". "Scheduled" is our status. "Upcoming" was old status.
            // If status is finished, redirect.
            if (eventData.status === 'finished') {
              alert('Cannot edit finished events.');
              this.router.navigate(['/events/all']);
              return;
            }
          }

          this.eventStatus.set(eventData.status);
          this.patchForm(eventData);
        }
      }
    });
  }

  futureDateValidator() {
    return (control: any) => {
      if (!control.value) return null;
      const inputDate = new Date(control.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Ignore time part for today check

      // If today is selected, it's technically valid regarding "future" if time is later, 
      // but usually "future" means >= today. 
      // User said "if he picked ended data system should show error". 
      // If we pick yesterday, error.
      if (inputDate < today) {
        return { pastDate: true };
      }
      return null;
    };
  }

  patchForm(event: Event) {
    const eventDate = new Date(event.date);
    this.eventForm.patchValue({
      basics: {
        name: event.name,
        type: event.type,
        speaker: event.speaker,
        venue: event.venue,
      },
      schedule: {
        date: formatDate(eventDate, 'yyyy-MM-dd', 'en-US'),
        time: formatDate(eventDate, 'HH:mm', 'en-US'),
        duration: event.duration
      },
      settings: {
        capacity: event.capacity,
        collectCompany: event.collectCompany,
        collectJobTitle: event.collectJobTitle,
      }
    });
  }

  selectEventType(type: EventType) {
    this.eventForm.get('basics.type')?.setValue(type);
  }

  nextStep() {
    if (this.currentStep() < this.steps.length) {
      this.currentStep.update(s => s + 1);
    }
  }

  prevStep() {
    if (this.currentStep() > 1) {
      this.currentStep.update(s => s - 1);
    }
  }

  goToStep(step: number) {
    if (step < this.currentStep()) {
      this.currentStep.set(step);
    }
  }

  cancel() {
    this.router.navigate(['/events/all']);
  }

  async saveEvent() {
    console.log('Save Event Triggered');
    console.log('Form Valid?', this.eventForm.valid);
    console.log('Form Errors:', this.eventForm.errors);
    console.log('Step 1 Valid?', this.basicsFormValid());
    console.log('Step 2 Valid?', this.scheduleFormValid());
    console.log('Step 2 Errors:', this.eventForm.get('schedule')?.errors);
    console.log('Date Errors:', this.eventForm.get('schedule.date')?.errors);

    if (!this.eventForm.valid) {
      console.error('Form is invalid, cannot save.');
      return;
    }

    const basics = this.eventForm.value.basics!;
    const schedule = this.eventForm.value.schedule!;

    const eventDate = new Date(`${schedule.date}T${schedule.time}`);

    const eventData: Omit<Event, 'id' | 'registrations' | 'attendees'> = {
      name: basics.name,
      type: basics.type,
      speaker: basics.speaker,
      venue: basics.venue!,
      date: eventDate.toISOString(),
      duration: schedule.duration,
      capacity: this.eventForm.value.settings!.capacity!,

      collectCompany: this.eventForm.value.settings!.collectCompany!,
      collectJobTitle: this.eventForm.value.settings!.collectJobTitle!,
      status: this.isEditMode() ? this.eventStatus() : 'scheduled' // Default for new, preserve for edit
    };

    try {
      if (this.isEditMode()) {
        await this.eventService.updateEvent({ ...eventData, id: this.eventId()! } as Event);
      } else {
        await this.eventService.addEvent(eventData);
      }
      this.router.navigate(['/events/all']);
    } catch (e) {
      console.error('Save failed', e);
      alert('Failed to save event.');
    }
  }
}
