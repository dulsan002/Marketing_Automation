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
        if (!query || query.length < 1) return []; // Allow single char search if backend supports it
        try {
            console.log(`DEBUG: Searching contacts for "${query}"`);
            const params = new HttpParams().set('search', query);
            const res = await firstValueFrom(this.http.get<{ status: string, data: Contact[] }>(this.apiUrl, { params }));
            console.log(`DEBUG: Search found ${res.data.length} contacts`);
            return res.data;
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
