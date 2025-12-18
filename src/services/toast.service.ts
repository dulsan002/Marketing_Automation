import { Injectable, signal } from '@angular/core';

export interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
}

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    readonly toasts = signal<Toast[]>([]);

    show(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration: number = 3000) {
        const id = Date.now().toString();
        const toast: Toast = { id, message, type };
        this.toasts.update(t => [...t, toast]);

        setTimeout(() => {
            this.remove(id);
        }, duration);
    }

    remove(id: string) {
        this.toasts.update(t => t.filter(toast => toast.id !== id));
    }
}
