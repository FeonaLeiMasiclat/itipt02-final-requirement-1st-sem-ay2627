
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
  atOutline,
  person,
  calendar,
  home,
  mailOutline,
  lockClosed,
  eye,
  eyeOff,
  play
} from 'ionicons/icons';

import { AuthService, authErrorMessage } from '../services/auth_service';

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
  username: string = '';
  password: string = '';

  // Angular Signals
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  constructor() {

    // Register Ionic Icons
    addIcons({
      atOutline,
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
    if (this.isLoading() || this.successMessage()) return;
    this.errorMessage.set('');
    this.successMessage.set('');
    const username = this.username.trim();

    const missingFields: string[] = [];
    if (!this.fullName.trim()) missingFields.push('Full name');
    if (!this.dateOfBirth.trim()) missingFields.push('Date of birth');
    if (!this.address.trim()) missingFields.push('Address');
    if (!this.email.trim()) missingFields.push('Email address');
    if (!username) missingFields.push('Username');
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

    if (!/^[A-Za-z0-9_.-]{3,64}$/.test(username)) {
      this.errorMessage.set('Use 3 to 64 letters, numbers, periods, underscores, or hyphens for your username.');
      return;
    }

    // Check Password Length
    if (this.password.length < 6 || this.password.length > 128) {

      this.errorMessage.set('Use a password between 6 and 128 characters.');
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
      username,
      password: this.password
    };

    this.isLoading.set(true);

    // Call Authentication Service
    this.authService.register(userData).subscribe({

      next: () => {

        this.successMessage.set(
          'Account created successfully!'
        );

        this.isLoading.set(false);

        // Clear Form
        this.fullName = '';
        this.dateOfBirth = '';
        this.address = '';
        this.email = '';
        this.username = '';
        this.password = '';

        // Navigate to Login
        setTimeout(() => {
          this.router.navigateByUrl('/login');
        }, 1500);

      },

      error: (error) => {

        this.errorMessage.set(authErrorMessage(error, 'Registration did not go through. Please try again.'));

        this.isLoading.set(false);

      }

    });

  }

}
