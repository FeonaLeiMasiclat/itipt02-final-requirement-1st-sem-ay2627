import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import type { OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { eye, eyeOff, lockClosed, person } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon, RouterLink],
})
export class LoginPage implements OnInit {
  private readonly router = inject(Router);
  username: string = '';
  password: string = '';
  rememberMe: boolean = false;
  showPassword: boolean = false;

  constructor() {
    addIcons({
      person,
      lockClosed,
      eye,
      eyeOff,
    });
  }

  ngOnInit(): void {
    localStorage.removeItem('lmsUserRole');
    const savedEmail = localStorage.getItem('lmsEmail');
    if (savedEmail) {
      this.username = savedEmail;
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  login(): void {
    const username = this.username.trim();
    const password = this.password;
    const normalizedUsername = username.toLowerCase();
    const demoPassword = password.trim();

    if (!username || !password) {
      alert('Please enter your username and password.');
      return;
    }

    if (normalizedUsername === 'admin' && demoPassword === 'admin') {
      localStorage.setItem('lmsDisplayName', 'admin');
      localStorage.setItem('lmsUserRole', 'admin');
      localStorage.setItem('lmsAdminLastLoginAt', new Date().toISOString());
      this.router.navigate(['/admin_homepage']);
      return;
    }

    const savedEmail = localStorage.getItem('lmsEmail');
    const savedPassword = localStorage.getItem('lmsPassword');
    const isHardcodedUser = normalizedUsername === 'user' && demoPassword === 'user';
    const isRegisteredUser = normalizedUsername === savedEmail?.trim().toLowerCase() && password === savedPassword;

    if (!isHardcodedUser && !isRegisteredUser) {
      alert('Invalid username or password.');
      return;
    }

    if (isHardcodedUser) {
      localStorage.setItem('lmsDisplayName', 'user');
    }

    localStorage.setItem('lmsUserRole', 'reader');
    this.router.navigate(['/reader_homepage']);
  }

  forgotPassword(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/forgot-password']);
  }
}
