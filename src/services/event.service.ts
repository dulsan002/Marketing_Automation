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
  private apiUrl = 'http://localhost:3001/api/events';
  private events = signal<Event[]>(MOCK_EVENTS);
  private registrations = signal<Registration[]>(MOCK_REGISTRATIONS);
  private analytics = signal<EventAnalytics>(MOCK_EVENT_ANALYTICS);

  private async simulate<T>(callback: () => T, delay = 200): Promise<T> {
    return new Promise<T>(resolve => setTimeout(() => resolve(callback()), delay));
  }

  async getEvents(): Promise<Event[]> {
    try {
      const res = await firstValueFrom(this.http.get<{ status: string, data: any[] }>(this.apiUrl));
      return res.data.map((e: any) => this.mapBackendEventToFrontend(e));
    } catch (e) {
      console.error('Event API unavailable', e);
      // Fallback disabled by request
      return [];
    }
  }

  async getEvent(id: string): Promise<Event | undefined> {
    try {
      const res = await firstValueFrom(this.http.get<{ status: string, data: any }>(`${this.apiUrl}/${id}`));
      return this.mapBackendEventToFrontend(res.data);
    } catch (e) {
      console.error('Event API unavailable for id ' + id, e);
      return undefined;
    }
  }

  async addEvent(eventData: Omit<Event, 'id' | 'registrations' | 'attendees' | 'status'> & { status?: Event['status'] }): Promise<Event> {
    try {
      // Map Frontend types/status to Backend Enums
      // Frontend: 'upcoming' | 'live' | 'completed' -> Backend: 'Draft' | 'Published' | 'Completed' | 'Cancelled'
      // For creation, we usually default to 'Published' if it's active.

      const backendStatus = 'Published';
      // Note: Backend doesn't support 'upcoming' literally. 
      // If we want 'Draft', we need UI to support it. 
      // For now, assuming 'new event' = Published.

      const backendType = this.capitalize(eventData.type);

      const payload = {
        name: eventData.name,
        type: backendType,
        venue: eventData.venue,
        startDate: eventData.date,
        speaker: eventData.speaker,
        duration: eventData.duration,
        status: backendStatus,
        collectCompany: eventData.collectCompany,
        collectJobTitle: eventData.collectJobTitle,
        description: ''
      };

      const res = await firstValueFrom(this.http.post<{ status: string, data: any }>(this.apiUrl, payload));
      const e = res.data;

      const newEvent: Event = this.mapBackendEventToFrontend(e);

      this.events.update(events => [newEvent, ...events]);
      return newEvent;
    } catch (e) {
      console.error('Failed to add event', e);
      throw e;
    }
  }

  async updateEvent(eventData: Event): Promise<Event> {
    try {
      // Map Frontend back to Backend
      const backendStatus = eventData.status === 'finished' ? 'Completed' : 'Published';
      const backendType = this.capitalize(eventData.type);

      const payload = {
        name: eventData.name,
        type: backendType,
        venue: eventData.venue,
        startDate: eventData.date,
        speaker: eventData.speaker,
        duration: eventData.duration,
        capacity: eventData.capacity,
        status: backendStatus,
        collectCompany: eventData.collectCompany,
        collectJobTitle: eventData.collectJobTitle,
      };

      const res = await firstValueFrom(this.http.put<{ status: string, data: any }>(`${this.apiUrl}/${eventData.id}`, payload));
      const e = res.data;

      const updatedEvent = this.mapBackendEventToFrontend(e);

      this.events.update(events => events.map(ev => ev.id === eventData.id ? updatedEvent : ev));
      return updatedEvent;

    } catch (e) {
      console.error('Failed to update event', e);
      throw e;
    }
  }

  private mapBackendEventToFrontend(e: any): Event {
    // Backend: 'Draft', 'Published', 'Completed', 'Cancelled'
    // Frontend: 'upcoming', 'live', 'completed'

    if (!e) {
      console.error('mapBackendEventToFrontend received null/undefined');
      throw new Error('Invalid event data');
    }

    try {
      let status: Event['status'] = 'scheduled';
      // Safety check for status
      const rawStatus = e.status || 'Published';

      if (rawStatus === 'Completed' || rawStatus === 'Cancelled') {
        status = 'finished';
      } else if (rawStatus === 'Published') {
        const now = new Date();
        const start = e.startDate ? new Date(e.startDate) : new Date(); // Safety
        const duration = e.duration || 60;
        const end = new Date(start.getTime() + duration * 60000);

        if (now < start) {
          status = 'scheduled';
        } else if (now >= start && now <= end) {
          status = 'active';
        } else {
          status = 'finished';
        }
      }

      const type = (e.type || 'webinar').toLowerCase() as any;

      return {
        id: e.id,
        name: e.name || 'Untitled Event',
        type: type,
        venue: e.venue || '',
        date: e.startDate || new Date().toISOString(),
        speaker: e.speaker || 'Unknown',
        duration: e.duration || 60,
        capacity: e.capacity || 100,
        status: status,
        registrations: e.registeredCount || 0,
        attendees: 0,
        collectCompany: e.collectCompany !== false, // default true
        collectJobTitle: e.collectJobTitle === true     // default false
      };
    } catch (err) {
      console.error('Error mapping event:', err, e);
      throw err;
    }
  }

  private capitalize(s: string): string {
    if (!s) return s;
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  async getRegistrations(eventId?: string): Promise<Registration[]> {
    // If eventId provided, fetch specific, else generic (mock fallback for global?)
    // API is global /api/events/:id/registrations
    // For now we assume this is used in context of an event
    // If no eventId, return empty or implement global fetch if API supports it
    // If no eventId, fetch global
    if (!eventId) {
      try {
        const res = await firstValueFrom(this.http.get<{ status: string, data: any[] }>(`${this.apiUrl}/registrations`));
        // Need to map global list same way
        return res.data.map((r: any) => ({
          id: r.id,
          registrant: {
            name: `${r.firstName || r.Contact?.firstName || 'Unknown'} ${r.lastName || r.Contact?.lastName || ''}`.trim(),
            email: r.email || r.Contact?.email || 'N/A'
          },
          company: r.company || r.Contact?.company || '',
          jobTitle: r.jobTitle || r.Contact?.jobTitle || '',
          eventId: r.EventId,
          eventName: r.Event?.name || 'Unknown',
          status: r.status,
          registeredDate: r.createdAt
        }));
      } catch (e) {
        console.warn('Failed to fetch all registrations', e);
        return [];
      }
    }

    try {
      const res = await firstValueFrom(this.http.get<{ status: string, data: any[] }>(`${this.apiUrl}/${eventId}/registrations`));
      return res.data.map((r: any) => ({
        id: r.id,
        registrant: {
          name: `${r.firstName || r.Contact?.firstName || 'Unknown'} ${r.lastName || r.Contact?.lastName || ''}`.trim(),
          email: r.email || r.Contact?.email || 'N/A'
        },
        company: r.company || r.Contact?.company || '',
        jobTitle: r.jobTitle || r.Contact?.jobTitle || '',
        eventId: r.EventId,
        eventName: 'Unknown',
        status: r.status,
        registeredDate: r.createdAt
      }));
    } catch (e) {
      console.warn('Failed to fetch registrations', e);
      return [];
    }
  }

  // Analytics - Backend doesn't have dedicated endpoint yet?
  // We can create one or fetch events and aggregate.
  // For now, keep mock or minimal fallback.
  async registerManual(data: { eventId: string, firstName: string, lastName: string, email: string, company: string, jobTitle: string, status: string }): Promise<void> {
    try {
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        company: data.company,
        jobTitle: data.jobTitle
      };

      await firstValueFrom(this.http.post(`${this.apiUrl}/${data.eventId}/register`, payload));

      // Refresh registrations to reflect changes
      const regs = await this.getRegistrations(data.eventId);
      this.registrations.set(regs);

      // Also refresh event to update count
      const updatedEvent = await this.getEvent(data.eventId);
      if (updatedEvent) {
        this.events.update(evs => evs.map(e => e.id === data.eventId ? updatedEvent : e));
      }

    } catch (e) {
      console.error('Manual registration failed', e);
      throw e;
    }
  }

  // Alias for legacy/modal support
  async addRegistration(data: Omit<Registration, 'id' | 'status' | 'registeredDate'> & { firstName?: string, lastName?: string, email?: string, company?: string, jobTitle?: string, status?: string }): Promise<void> {
    // Adapter to match registerManual signature if needed, or if data structure differs
    const fullName = data.registrant?.name || '';
    const nameParts = fullName.trim().split(' ');
    const firstName = data.firstName || nameParts[0] || '';
    const lastName = data.lastName || nameParts.slice(1).join(' ') || '';

    const manualData = {
      eventId: data.eventId,
      firstName: firstName,
      lastName: lastName,
      email: data.registrant?.email || data.email || '',
      company: data.company || '',
      jobTitle: data.jobTitle || '',
      status: data.status || 'Registered'
    };
    return this.registerManual(manualData);
  }

  async updateRegistrationStatus(registrationId: string, newStatus: RegistrationStatus, eventId?: string, options?: { banReason?: string, adminName?: string, adminEmail?: string, unbanReason?: string, isUnban?: boolean }): Promise<void> {
    // Optimization: If eventId is provided, used it directly.
    // Otherwise fallback to looking up in local cache (which might be stale).

    let targetEventId = eventId;

    if (!targetEventId) {
      const reg = this.registrations().find(r => r.id === registrationId);
      if (!reg) {
        console.error('Cannot update status for unknown registration', registrationId);
        // We can't proceed without eventId because API route needs it: /api/events/:eventId/registrations/:regId
        return;
      }
      targetEventId = reg.eventId;
    }

    try {
      await firstValueFrom(this.http.put(`${this.apiUrl}/${targetEventId}/registrations/${registrationId}`, { status: newStatus, ...options }));

      // Update local state
      this.registrations.update(regs => regs.map(r => r.id === registrationId ? { ...r, status: newStatus, ...options } : r));
    } catch (e) {
      console.error('Failed to update registration status', e);
      throw e;
    }
  }

  async registerContact(eventId: string, contactId: string): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${this.apiUrl}/${eventId}/register`, { contactId }));

      // Refresh local state
      const regs = await this.getRegistrations(eventId);
      this.registrations.set(regs);

      // Update event counts
      const updatedEvent = await this.getEvent(eventId);
      if (updatedEvent) {
        this.events.update(evs => evs.map(e => e.id === eventId ? updatedEvent : e));
      }
    } catch (e) {
      console.error('Failed to register contact', e);
      throw e;
    }
  }

  async getAnalytics(): Promise<EventAnalytics> {
    try {
      // Fetch real data from backend
      const res = await firstValueFrom(this.http.get<{ status: string, data: EventAnalytics }>(`${this.apiUrl}/analytics`));
      return res.data;
    } catch (e) {
      console.error('Failed to fetch analytics', e);
      // Return empty structure or mock if offline for dev resilience?
      // User asked for "real backend data", so let's stick to that.
      // But to prevent UI crash if server is down (e.g. during restart), we can return empty.
      return {
        totalEvents: 0,
        totalRegistrations: 0,
        totalAttendees: 0,
        noShows: 0,
        attendanceByEvent: []
      };
    }
  }
}