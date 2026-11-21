
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import {
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonInput,
  IonIcon,
  IonButton
} from '@ionic/angular';

import { addIcons } from 'ionicons';
import {
  person,
  lockClosed,
  eye,
  eyeOff,
  heartOutline,
  bookOutline,
  bookmarkOutline,
  albumsOutline,
  heartCircle
} from 'ionicons/icons';

import { AuthService } from '../services/auth_service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonInput,
    IonIcon,
    IonButton
  ]
})

export class LoginPage {

  // Dependency Injection
  private authService = inject(AuthService);
  private router = inject(Router);

  // Component Properties
  username: string = '';
  password: string = '';

  // Angular Signals
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');

  constructor() {

    // Register Ionic Icons
    addIcons({
      person,
      lockClosed,
      eye,
      eyeOff,
      heartOutline,
      bookOutline,
      bookmarkOutline,
      albumsOutline,
      heartCircle
    });

  }

  // Show or Hide Password
  togglePassword() {

    this.showPassword.update(value => !value);

  }

  
  // Login Method
  login() {

    this.errorMessage.set('');

    // Get Input Values
    const enteredUsername = this.username.trim();
    const enteredPassword = this.password.trim();

    // Check Empty Inputs
    if (
      enteredUsername === '' ||
      enteredPassword === ''
    ) {

      this.errorMessage.set(
        'Please enter your username and password.'
      );

      return;
    }

    this.isLoading.set(true);

    // READER LOGIN
    if (
      enteredUsername === 'user' &&
      enteredPassword === 'user'
    ) {

      localStorage.setItem('userData', JSON.stringify({
        username: 'user',
        role: 'reader'
      }));

      this.authService.isAuthenticated.set(true);
      this.isLoading.set(false);

      this.router.navigateByUrl('/reader-home');

    }

    // ADMIN LOGIN
    else if (
      enteredUsername === 'admin' &&
      enteredPassword === 'admin'
    ) {

      localStorage.setItem('userData', JSON.stringify({
        username: 'admin',
        role: 'admin'
      }));

      this.authService.isAuthenticated.set(true);
      this.isLoading.set(false);

      this.router.navigateByUrl('/admin-home');

    }

    // INVALID LOGIN
    else {

      this.isLoading.set(false);

      this.errorMessage.set(
        'Invalid username or password.'
      );

    }

  }


}
