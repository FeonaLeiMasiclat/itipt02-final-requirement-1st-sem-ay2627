import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { catchError, of, tap } from 'rxjs';

export interface ProfileInformation {
  fullName: string;
  dateOfBirth: string;
  address: string;
  email: string;
}

export interface LibraryUser {
  id: number;
  username: string | null;
  role: 'reader' | 'admin';
  fullName: string;
  dateOfBirth: string | null;
  address: string | null;
  email: string | null;
}

export interface DemoMessage {
  email: string;
  token: string;
}

export function authErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0 || error.status === 502 || error.status === 504) {
      return 'Cannot connect to the library server. Please try again.';
    }
    if (typeof error.error?.detail === 'string') return error.error.detail;
  }
  return fallback;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly user = signal<LibraryUser | null>(null);
  private token = '';
  readonly currentUser = this.user.asReadonly();

  login(identifier: string, password: string) {
    return this.http.post<{ token: string; user: LibraryUser }>('/api/login', { username: identifier, password }).pipe(
      tap(({ token, user }) => {
        this.token = token;
        this.user.set(user);
      }),
    );
  }

  register(data: ProfileInformation & { username: string; password: string }) {
    return this.http.post<{ message: string }>('/api/register', data);
  }

  refreshUser() {
    if (!this.token) return of(null);

    return this.http.get<LibraryUser>('/api/me', { headers: this.authorizationHeaders() }).pipe(
      catchError(() => {
        this.logout();
        return of(null);
      }),
      tap(user => this.user.set(user)),
    );
  }

  saveProfileInformation(profile: ProfileInformation) {
    return this.http.patch<LibraryUser>('/api/me', profile, { headers: this.authorizationHeaders() }).pipe(
      tap(user => this.user.set(user)),
    );
  }

  logout(): void {
    this.token = '';
    this.user.set(null);
  }

  forgotPassword(email: string) {
    return this.http.post<{ message: string; mail: DemoMessage | null }>('/api/forgot-password', { email });
  }

  resetPassword(token: string, password: string) {
    return this.http.post<{ message: string }>('/api/reset-password', { token, password }).pipe(
      tap(() => this.logout()),
    );
  }

  authorizationHeaders() {
    return { Authorization: `Bearer ${this.token}` };
  }
}
