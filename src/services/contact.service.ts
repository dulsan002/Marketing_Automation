import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Contact } from '../types';

@Injectable({
    providedIn: 'root'
})
export class ContactService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:3001/api/contacts';

    async searchContacts(query: string): Promise<Contact[]> {
        if (!query || query.length < 2) return [];
        try {
            // Backend returns all contacts on GET /, so we filter client-side for now
            const res = await firstValueFrom(this.http.get<{ status: string, data: Contact[] }>(this.apiUrl));
            const all = res.data;
            const lowerQ = query.toLowerCase();
            return all.filter(c =>
                (c.firstName?.toLowerCase().includes(lowerQ) || false) ||
                (c.lastName?.toLowerCase().includes(lowerQ) || false) ||
                (c.email?.toLowerCase().includes(lowerQ) || false)
            );
        } catch (e) {
            console.error('Failed to search contacts', e);
            return [];
        }
    }

    async getContacts(): Promise<Contact[]> {
        try {
            const res = await firstValueFrom(this.http.get<{ status: string, data: Contact[] }>(this.apiUrl));
            return res.data;
        } catch (e) {
            console.error('Failed to get contacts', e);
            return [];
        }
    }
}
