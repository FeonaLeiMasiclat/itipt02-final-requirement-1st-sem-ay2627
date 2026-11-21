
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

  // Register Account
  register() {

    this.errorMessage.set('');
    this.successMessage.set('');

    // Check Empty Inputs
    if (
      this.fullName.trim() === '' ||
      this.dateOfBirth === '' ||
      this.address.trim() === '' ||
      this.email.trim() === '' ||
      this.password.trim() === ''
    ) {

      this.errorMessage.set(
        'Please complete all required fields.'
      );

      return;
    }

    // Check Email Format
    if (!this.email.includes('@') || !this.email.includes('.')) {

      this.errorMessage.set(
        'Please enter a valid email address.'
      );

      return;
    }

    // Check Password Length
    if (this.password.length < 6) {

      this.errorMessage.set(
        'Password must contain at least 6 characters.'
      );

      return;
    }

    // Check Date of Birth
    const birthDate = new Date(this.dateOfBirth);
    const today = new Date();

    if (
      isNaN(birthDate.getTime()) ||
      birthDate >= today
    ) {

      this.errorMessage.set(
        'Please enter a valid date of birth.'
      );

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

        this.errorMessage.set(
          error?.error?.message ||
          'Registration failed. Please try again.'
        );

        this.isLoading.set(false);

      }

    });

  }

}
