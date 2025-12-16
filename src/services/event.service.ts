import { Injectable, signal } from '@angular/core';
import { Event, Registration, EventAnalytics, RegistrationStatus, EventType } from '../types';
import { MOCK_EVENTS, MOCK_REGISTRATIONS, MOCK_EVENT_ANALYTICS } from '../data/events-mock-data';

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private events = signal<Event[]>(MOCK_EVENTS);
  private registrations = signal<Registration[]>(MOCK_REGISTRATIONS);
  private analytics = signal<EventAnalytics>(MOCK_EVENT_ANALYTICS);

  private async simulate<T>(callback: () => T, delay = 200): Promise<T> {
    return new Promise<T>(resolve => setTimeout(() => resolve(callback()), delay));
  }

  getEvents(): Promise<Event[]> {
    return this.simulate(() => deepClone(this.events()));
  }

  getEvent(id: string): Promise<Event | undefined> {
    return this.simulate(() => deepClone(this.events().find(e => e.id === id)));
  }

  addEvent(eventData: Omit<Event, 'id' | 'status' | 'registrations' | 'attendees'>): Promise<Event> {
    return this.simulate(() => {
      const newEvent: Event = {
        ...eventData,
        id: `evt_${Date.now()}`,
        status: new Date(eventData.date) > new Date() ? 'upcoming' : 'completed',
        registrations: 0,
        attendees: 0,
      };
      this.events.update(events => [newEvent, ...events]);
      return newEvent;
    });
  }

  updateEvent(eventData: Event): Promise<Event> {
     return this.simulate(() => {
      this.events.update(events => events.map(e => e.id === eventData.id ? {...e, ...eventData} : e));
      return eventData;
    });
  }

  getRegistrations(): Promise<Registration[]> {
    return this.simulate(() => deepClone(this.registrations()));
  }

  addRegistration(regData: Omit<Registration, 'id' | 'status' | 'registeredDate'>): Promise<Registration> {
    return this.simulate(() => {
      const newReg: Registration = {
        ...regData,
        id: `reg_${Date.now()}`,
        status: 'confirmed',
        registeredDate: new Date().toISOString(),
      };
      this.registrations.update(regs => [newReg, ...regs]);
      return newReg;
    });
  }

  getAnalytics(): Promise<EventAnalytics> {
    return this.simulate(() => deepClone(this.analytics()));
  }

  updateRegistrationStatus(registrationId: string, status: RegistrationStatus): Promise<void> {
    return this.simulate(() => {
      this.registrations.update(regs =>
        regs.map(r => (r.id === registrationId ? { ...r, status } : r))
      );
    });
  }
}