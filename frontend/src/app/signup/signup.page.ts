
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import {
  IonContent,
  IonCard,
  IonCardContent,
  IonInput,
  IonIcon,
  IonButton
} from '@ionic/angular';

import { addIcons } from 'ionicons';
import {
  person,
  calendar,
  home,
  mailOutline,
  lockClosed,
  eye,
  eyeOff,
  play
} from 'ionicons/icons';

import { AuthService } from '../services/auth_service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    IonContent,
    IonCard,
    IonCardContent,
    IonInput,
    IonIcon,
    IonButton
  ]
})

export class SignupPage {

  // Dependency Injection
  private authService = inject(AuthService);
  private router = inject(Router);

  // Component Properties
  fullName: string = '';
  dateOfBirth: string = '';
  address: string = '';
  email: string = '';
  password: string = '';

  // Angular Signals
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  constructor() {

    // Register Ionic Icons
    addIcons({
      person,
      calendar,
      home,
      mailOutline,
      lockClosed,
      eye,
      eyeOff,
      play
    });

  }

  // Show or Hide Password
  togglePassword() {

    this.showPassword.update(value => !value);

  }

  clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  // Register Account
  register() {

    this.errorMessage.set('');
    this.successMessage.set('');

    const missingFields: string[] = [];
    if (!this.fullName.trim()) missingFields.push('Full name');
    if (!this.dateOfBirth.trim()) missingFields.push('Date of birth');
    if (!this.address.trim()) missingFields.push('Address');
    if (!this.email.trim()) missingFields.push('Email address');
    if (!this.password.trim()) missingFields.push('Password');

    if (missingFields.length > 0) {
      const missingList = missingFields.join(', ');
      const dateHint = missingFields.includes('Date of birth')
        ? ' Tap the calendar field and choose your birth date.'
        : '';
      this.errorMessage.set(`Missing information: ${missingList}.${dateHint}`);
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(this.email.trim())) {
      this.errorMessage.set('Email address looks incomplete. Enter a valid address, such as name@example.com.');
      return;
    }

    // Check Password Length
    if (this.password.length < 6) {

      this.errorMessage.set('Password is too short. Use at least 6 characters.');
      return;
    }

    const birthDate = new Date(`${this.dateOfBirth}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (
      Number.isNaN(birthDate.getTime()) ||
      birthDate >= today
    ) {
      this.errorMessage.set('Date of birth must be a valid date in the past. Please check the selected date.');
      return;
    }

    // Registration Data
    const userData = {
      fullName: this.fullName.trim(),
      dateOfBirth: this.dateOfBirth,
      address: this.address.trim(),
      email: this.email.trim(),
      password: this.password
    };

    this.isLoading.set(true);

    // Call Authentication Service
    this.authService.register(userData).subscribe({

      next: (response) => {

        console.log('Registration successful:', response);

        this.successMessage.set(
          'Account created successfully!'
        );

        this.authService.saveRegisteredProfile({
          fullName: userData.fullName,
          dateOfBirth: userData.dateOfBirth,
          address: userData.address,
          email: userData.email
        });

        this.isLoading.set(false);

        // Clear Form
        this.fullName = '';
        this.dateOfBirth = '';
        this.address = '';
        this.email = '';
        this.password = '';

        // Navigate to Login
        setTimeout(() => {
          this.router.navigateByUrl('/login');
        }, 1500);

      },

      error: (error) => {

        console.log('Registration failed:', error);

        this.errorMessage.set(this.registrationErrorMessage(error));

        this.isLoading.set(false);

      }

    });

  }

  private registrationErrorMessage(error: any): string {
    const serverMessage = typeof error?.error?.message === 'string'
      ? error.error.message
      : typeof error?.error === 'string'
        ? error.error
        : '';
    const details = `${serverMessage} ${error?.message || ''}`.toLowerCase();

    if (
      error?.status === 0 ||
      details.includes('failed to fetch') ||
      details.includes('network error') ||
      details.includes('load failed')
    ) {
      return 'Cannot connect to the registration server at localhost:3000. Start the backend API, then try again. Your details are still in the form.';
    }

    return serverMessage || 'Registration did not go through. Please try again.';
  }

}
