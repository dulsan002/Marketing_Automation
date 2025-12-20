import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Event, Registration, EventAnalytics, RegistrationStatus, EventType } from '../types';
import { MOCK_EVENTS, MOCK_REGISTRATIONS, MOCK_EVENT_ANALYTICS } from '../data/events-mock-data';
import { firstValueFrom } from 'rxjs';

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private http = inject(HttpClient);
  // Assumption: /api/events
  private events = signal<Event[]>(MOCK_EVENTS);
  private registrations = signal<Registration[]>(MOCK_REGISTRATIONS);
  private analytics = signal<EventAnalytics>(MOCK_EVENT_ANALYTICS);

  private async simulate<T>(callback: () => T, delay = 200): Promise<T> {
    return new Promise<T>(resolve => setTimeout(() => resolve(callback()), delay));
  }

  async getEvents(): Promise<Event[]> {
    try {
      const res = await firstValueFrom(this.http.get<{ status: string, data: any[] }>(`http://localhost:3001/api/events`));
      return res.data.map((e: any) => ({
        id: e.id,
        name: e.name,
        type: e.type,
        date: e.date,
        // location: e.location, // Removed as not in Event interface
        speaker: e.speaker || 'Unknown', // Added
        duration: e.duration || 60, // Added
        status: e.status,
        registrations: e.registrations || 0,
        attendees: e.attendees || 0
      }));
    } catch (e) {
      console.warn('Event API unavailable', e);
      return this.simulate(() => deepClone(this.events()));
    }
  }

  async getEvent(id: string): Promise<Event | undefined> {
    try {
      const res = await firstValueFrom(this.http.get<{ status: string, data: any }>(`http://localhost:3001/api/events/${id}`));
      const e = res.data;
      return {
        id: e.id,
        name: e.name,
        type: e.type,
        date: e.date,
        // location: e.location, // Removed
        speaker: e.speaker || 'Unknown', // Added
        duration: e.duration || 60, // Added
        status: e.status,
        registrations: e.registrations || 0,
        attendees: e.attendees || 0
      };
    } catch (e) {
      return this.simulate(() => deepClone(this.events().find(e => e.id === id)));
    }
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
      this.events.update(events => events.map(e => e.id === eventData.id ? { ...e, ...eventData } : e));
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