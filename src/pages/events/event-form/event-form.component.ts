import { ChangeDetectionStrategy, Component, signal, inject, computed } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { EventService } from '../../../services/event.service';
import { Event, EventType } from '../../../types';

@Component({
  selector: 'app-event-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './event-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventFormComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private eventService = inject(EventService);

  readonly currentStep = signal(1);
  readonly eventId = signal<string | null>(null);
  readonly isEditMode = computed(() => this.eventId() !== null);

  readonly steps = [
    { number: 1, name: 'Basics' },
    { number: 2, name: 'Schedule' },
    { number: 3, name: 'Settings' },
    { number: 4, name: 'Review' },
  ];

  eventForm = this.fb.group({
    basics: this.fb.group({
      name: ['', Validators.required],
      type: ['webinar' as EventType, Validators.required],
      speaker: ['', Validators.required],
    }),
    schedule: this.fb.group({
      date: ['', Validators.required],
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
  
  constructor() {
    this.route.paramMap.subscribe(async params => {
      const id = params.get('id');
      if (id) {
        this.eventId.set(id);
        const eventData = await this.eventService.getEvent(id);
        if (eventData) {
          this.patchForm(eventData);
        }
      }
    });
  }
  
  patchForm(event: Event) {
    const eventDate = new Date(event.date);
    this.eventForm.patchValue({
      basics: {
        name: event.name,
        type: event.type,
        speaker: event.speaker,
      },
      schedule: {
        date: formatDate(eventDate, 'yyyy-MM-dd', 'en-US'),
        time: formatDate(eventDate, 'HH:mm', 'en-US'),
        duration: event.duration
      },
      settings: {
        capacity: event.registrations, // Assuming capacity is reflected by registrations in mock
      }
    });
  }

  isStepValid = computed(() => {
    switch(this.currentStep()) {
      case 1: return this.eventForm.get('basics')!.valid;
      case 2: return this.eventForm.get('schedule')!.valid;
      case 3: return this.eventForm.get('settings')!.valid;
      default: return true;
    }
  });

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

  cancel() {
    this.router.navigate(['/events/all']);
  }
  
  async saveEvent() {
    if (!this.eventForm.valid) return;
    
    const basics = this.eventForm.value.basics!;
    const schedule = this.eventForm.value.schedule!;
    
    const eventDate = new Date(`${schedule.date}T${schedule.time}`);
    
    const eventData: Omit<Event, 'id' | 'status' | 'registrations' | 'attendees'> = {
      name: basics.name,
      type: basics.type,
      speaker: basics.speaker,
      date: eventDate.toISOString(),
      duration: schedule.duration,
    };

    if(this.isEditMode()) {
      await this.eventService.updateEvent({ ...eventData, id: this.eventId()! } as Event);
    } else {
      await this.eventService.addEvent(eventData);
    }
    
    this.router.navigate(['/events/all']);
  }
}