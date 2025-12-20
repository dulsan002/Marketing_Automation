import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';

export interface User {
    id: string;
    email: string;
    role: 'ADMIN' | 'MARKETER' | 'VIEWER';
    tenantId: string;
    tenantName?: string;
    tenantSlug?: string;
    name?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    // Signals for reactivity
    private currentUser = signal<User | null>(this.loadUserFromStorage());

    // Computed values
    isAuthenticated = computed(() => !!this.currentUser());
    userRole = computed(() => this.currentUser()?.role);

    constructor(private router: Router) { }

    login(token: string, user: User) {
        sessionStorage.setItem('accessToken', token);
        sessionStorage.setItem('user', JSON.stringify(user));
        this.currentUser.set(user);
        this.router.navigate(['/dashboard']);
    }

    logout() {
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('user');
        this.currentUser.set(null);
        this.router.navigate(['/login']);
    }

    getToken(): string | null {
        return sessionStorage.getItem('accessToken');
    }

    private loadUserFromStorage(): User | null {
        const userStr = sessionStorage.getItem('user');
        if (userStr && userStr !== 'undefined') {
            try {
                return JSON.parse(userStr);
            } catch (e) {
                console.error('Failed to parse user from storage', e);
                return null;
            }
        }
        return null;
    }
}
