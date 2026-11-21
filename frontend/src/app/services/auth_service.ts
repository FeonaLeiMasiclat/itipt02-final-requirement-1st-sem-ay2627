
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class AuthService {

  // HTTP Client
  private http = inject(HttpClient);

  // API URL
  private apiUrl = 'http://localhost:3000/api';

  // Authentication Signal
  isAuthenticated = signal(!!localStorage.getItem('userData'));

  // Login Request
  login(username: string, password: string): Observable<any> {

    return this.http.post<any>(`${this.apiUrl}/login`, {

      username: username,
      password: password

    }).pipe(

      tap(response => {

        // Save API Response
        localStorage.setItem(
          'userData',
          JSON.stringify(response)
        );

        this.isAuthenticated.set(true);

      })

    );

  }

  // Register Request
  register(userData: any): Observable<any> {

    return this.http.post<any>(
      `${this.apiUrl}/register`,
      userData
    );

  }

  // Get Saved User Data
  getUserData() {

    const savedData = localStorage.getItem('userData');

    if (savedData) {

      try {

        return JSON.parse(savedData);

      } catch (error) {

        console.log('Error reading saved user data:', error);

        return null;

      }

    }

    return null;

  }

  // Logout
  logout() {

    localStorage.removeItem('userData');

    this.isAuthenticated.set(false);

  }

  forgotPassword(email: string): Observable<any> {

    return this.http.post<any>(
      `${this.apiUrl}/forgot-password`,
      {
        email: email
      }
    );

  }

}
