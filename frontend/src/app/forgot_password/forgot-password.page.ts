
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonCard,
  IonCardContent,
  IonInput,
  IonIcon,
  IonButton,
  IonLabel
} from '@ionic/angular';

import { addIcons } from 'ionicons';
import { mailOutline } from 'ionicons/icons';

import { AuthService } from '../services/auth_service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: true,
  imports: [
    FormsModule,
    IonContent,
    IonCard,
    IonCardContent,
    IonInput,
    IonIcon,
    IonButton,
    IonLabel
  ]
})

export class ForgotPasswordPage {

  // Dependency Injection
  private authService = inject(AuthService);

  // Component Properties
  email: string = '';

  // Angular Signals
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  constructor(private router: Router) {

    // Register Ionic Icons
    addIcons({
      mailOutline
    });

  }

  // Send Password Reset Link
  sendResetLink() {

    this.errorMessage.set('');
    this.successMessage.set('');

    // Check Empty Email
    if (this.email.trim() === '') {

      this.errorMessage.set(
        'Please enter your email address.'
      );

      return;
    }

    // Check Email Format
    const emailPattern =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailPattern.test(this.email.trim())) {

      this.errorMessage.set(
        'Please enter a valid email address.'
      );

      return;
    }

    this.isLoading.set(true);

    // Call Authentication Service
    this.authService.forgotPassword(this.email.trim())
      .subscribe({

        next: (response) => {

          console.log('Reset request successful:', response);

          this.successMessage.set(
            'Password reset instructions have been sent to your email.'
          );

          this.isLoading.set(false);

          this.email = '';

        },

        error: (error) => {

          console.log('Reset request failed:', error);

          this.errorMessage.set(
            error?.error?.message ||
            'Unable to send reset link. Please try again.'
          );

          this.isLoading.set(false);

        }

      });

  }

  goToLogin(): void {
  this.router.navigate(['/login']);
}

}
