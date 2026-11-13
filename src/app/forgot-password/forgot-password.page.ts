import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: true,
  imports: [FormsModule, IonContent, RouterLink],
})
export class ForgotPasswordPage {
  email = '';

  constructor(private router: Router) {}

  sendResetLink() {
    if (!this.email.trim()) {
      alert('Please enter your email address.');
      return;
    }

    alert('A password reset link has been sent to your email.');
    this.router.navigate(['/home']);
  }
}
