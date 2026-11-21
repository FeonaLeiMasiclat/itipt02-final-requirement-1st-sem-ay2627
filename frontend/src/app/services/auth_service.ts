
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable, tap } from 'rxjs';

export interface ProfileInformation {
  fullName: string;
  dateOfBirth: string;
  address: string;
  email: string;
}

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

  getProfileInformation(): ProfileInformation {
    const session = this.getUserData() ?? {};
    const sessionUser = session.user && typeof session.user === 'object'
      ? session.user
      : session;
    const savedProfile = this.readProfileRecord('profileInformation');
    const registeredProfile = this.readProfileRecord('registeredProfile');
    const firstValue = (...values: unknown[]): string => {
      const value = values.find(item => typeof item === 'string' && item.trim().length > 0);
      return typeof value === 'string' ? value : '';
    };

    return {
      fullName: firstValue(
        sessionUser.full_name, sessionUser.fullName, session.full_name, session.fullName,
        savedProfile['fullName'], savedProfile['full_name'],
        registeredProfile['fullName'], registeredProfile['full_name']
      ),
      dateOfBirth: firstValue(
        sessionUser.date_of_birth, sessionUser.dateOfBirth, session.date_of_birth, session.dateOfBirth,
        savedProfile['dateOfBirth'], savedProfile['date_of_birth'],
        registeredProfile['dateOfBirth'], registeredProfile['date_of_birth']
      ),
      address: firstValue(
        sessionUser.address, session.address,
        savedProfile['address'], registeredProfile['address']
      ),
      email: firstValue(
        sessionUser.email, session.email,
        savedProfile['email'], registeredProfile['email']
      )
    };
  }

  saveRegisteredProfile(profile: ProfileInformation): void {
    localStorage.setItem('registeredProfile', JSON.stringify(profile));
  }

  saveProfileInformation(profile: ProfileInformation): void {
    localStorage.setItem('profileInformation', JSON.stringify(profile));

    const session = this.getUserData();
    if (!session) return;

    const profileFields = {
      fullName: profile.fullName,
      full_name: profile.fullName,
      dateOfBirth: profile.dateOfBirth,
      date_of_birth: profile.dateOfBirth,
      address: profile.address,
      email: profile.email
    };
    const updatedSession = { ...session, ...profileFields };

    if (session.user && typeof session.user === 'object') {
      updatedSession.user = { ...session.user, ...profileFields };
    }

    localStorage.setItem('userData', JSON.stringify(updatedSession));
  }

  private readProfileRecord(key: string): Record<string, unknown> {
    try {
      const record = localStorage.getItem(key);
      return record ? JSON.parse(record) as Record<string, unknown> : {};
    } catch {
      return {};
    }
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
