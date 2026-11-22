
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

import { AuthService, authErrorMessage } from '../services/auth_service';

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
  identifier = '';
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

  login(): void {
    if (this.isLoading()) return;
    this.errorMessage.set('');
    const identifier = this.identifier.trim();
    if (!identifier || !this.password) {
      this.errorMessage.set('Please enter your email or username and password.');
      return;
    }

    this.isLoading.set(true);
    this.authService.login(identifier, this.password).subscribe({
      next: ({ user }) => {
        this.password = '';
        this.isLoading.set(false);
        void this.router.navigateByUrl(user.role === 'admin' ? '/admin-home' : '/reader-home', {
          replaceUrl: true,
        });
      },
      error: error => {
        this.isLoading.set(false);
        this.errorMessage.set(authErrorMessage(error, 'Unable to sign in. Please try again.'));
      },
    });
  }


}
