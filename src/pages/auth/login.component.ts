import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService, User } from '../../services/auth.service';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background-color: #f3f4f6;
    }
    .login-card {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      width: 100%;
      max-width: 400px;
    }
    .form-group {
      margin-bottom: 1rem;
    }
    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #374151;
    }
    input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 1rem;
    }
    input:focus {
      outline: none;
      border-color: #2563eb;
      ring: 2px solid #2563eb;
    }
    button {
      width: 100%;
      padding: 0.75rem;
      background-color: #000;
      color: white;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    button:hover {
      background-color: #1f2937;
    }
    button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    .error-msg {
      color: #dc2626;
      font-size: 0.875rem;
      margin-bottom: 1rem;
      text-align: center;
    }
  `]
})
export class LoginComponent {
  tenantSlug = '';
  email = '';
  password = '';
  isLoading = false;
  error = signal<string>('');

  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private router = inject(Router);

  async onSubmit() {
    if (!this.tenantSlug || !this.email || !this.password) {
      this.error.set('Please enter Organization, Email, and Password');
      return;
    }

    this.isLoading = true;
    this.error.set('');

    try {
      // Direct call to backend auth endpoint
      // Note: Backend port 3000 assumed based on report
      const response = await firstValueFrom(
        this.http.post<{ status: string, data: { accessToken: string, user: User } }>(
          'http://localhost:3001/api/auth/login',
          {
            tenantSlug: this.tenantSlug.trim(),
            email: this.email.trim(),
            password: this.password
          }
        )
      );

      if (response.status === 'success') {
        this.authService.login(response.data.accessToken, response.data.user);
      } else {
        this.error.set('Login failed');
      }
    } catch (e: any) {
      console.error(e);
      if (e.status === 401) {
        this.error.set(e.error?.message || 'Invalid credentials');
      } else {
        this.error.set('Server error: ' + (e.error?.message || e.message));
      }
    } finally {
      this.isLoading = false;
    }
  }
}
