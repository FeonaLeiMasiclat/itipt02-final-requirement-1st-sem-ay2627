import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent, IonCard, IonCardContent, IonInput, IonIcon, IonButton, IonLabel } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { mailOutline } from 'ionicons/icons';

import { AuthService, authErrorMessage, DemoMessage } from '../services/auth_service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: true,
  imports: [FormsModule, RouterLink, IonContent, IonCard, IonCardContent, IonInput, IonIcon, IonButton, IonLabel],
})
export class ForgotPasswordPage {
  private readonly authService = inject(AuthService);
  private readonly fragment = toSignal(inject(ActivatedRoute).fragment);
  readonly resetToken = computed(() => {
    const fragment = this.fragment();
    return fragment?.startsWith('reset=') ? fragment.slice(6) : '';
  });
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly showInboxButton = signal(false);
  readonly inboxOpened = signal(false);
  readonly demoMessage = signal<DemoMessage | null>(null);
  readonly passwordChanged = signal(false);
  email = '';
  newPassword = '';
  confirmPassword = '';

  constructor(private router: Router) {
    addIcons({ mailOutline });
  }

  clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  sendResetLink(): void {
    if (this.isLoading()) return;
    this.clearMessages();
    this.showInboxButton.set(false);
    this.inboxOpened.set(false);
    this.demoMessage.set(null);
    const email = this.email.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.errorMessage.set('Please enter a valid email address.');
      return;
    }

    this.isLoading.set(true);
    this.authService.forgotPassword(email).subscribe({
      next: response => {
        this.successMessage.set(response.message);
        this.demoMessage.set(response.mail);
        this.showInboxButton.set(true);
        this.isLoading.set(false);
      },
      error: error => {
        this.errorMessage.set(authErrorMessage(error, 'Unable to create a reset link.'));
        this.isLoading.set(false);
      },
    });
  }

  openDemoInbox(): void {
    this.clearMessages();
    this.inboxOpened.set(true);
  }

  resetPassword(): void {
    if (this.isLoading() || !this.resetToken()) return;
    this.clearMessages();
    if (this.newPassword.length < 6 || this.newPassword.length > 128) {
      this.errorMessage.set('Use a password between 6 and 128 characters.');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage.set('The passwords do not match.');
      return;
    }

    this.isLoading.set(true);
    this.authService.resetPassword(this.resetToken(), this.newPassword).subscribe({
      next: response => {
        this.newPassword = '';
        this.confirmPassword = '';
        this.demoMessage.set(null);
        this.passwordChanged.set(true);
        this.successMessage.set(response.message);
        this.isLoading.set(false);
        void this.router.navigate(['/forgot-password'], { replaceUrl: true });
      },
      error: error => {
        this.errorMessage.set(authErrorMessage(error, 'Unable to reset your password.'));
        this.isLoading.set(false);
      },
    });
  }

  goToLogin(): void {
    void this.router.navigate(['/login'], { replaceUrl: true });
  }
}
