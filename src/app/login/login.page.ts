
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { IonHeader, IonToolbar, IonTitle, IonContent, IonIcon } from '@ionic/angular';

import { addIcons } from 'ionicons';
import {person, lockClosed, eye, eyeOff} from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, RouterLink
  ],
})
export class LoginPage {

  username: string = '';
  password: string = '';
  rememberMe: boolean = false;
  showPassword: boolean = false;

  constructor(private router: Router) {
    addIcons({
      person,
      lockClosed,
      eye,
      eyeOff
    });
  }

  ngOnInit() {
    const savedEmail = localStorage.getItem('lmsEmail');
    if (savedEmail) {
      this.username = savedEmail;
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  login() {
    const username = this.username.trim();
    const password = this.password;

    if (!username || !password) {
      alert('Please enter your username and password.');
      return;
    }

<<<<<<< HEAD:src/app/home/home.page.ts
    const isAdmin = this.username === 'admin' && this.password === 'admin';
    const isUser = this.username === 'user' && this.password === 'user';

    if (!isAdmin && !isUser) {
=======
    if (username === 'admin' && password === 'admin') {
      localStorage.setItem('lmsDisplayName', 'admin');
      localStorage.setItem('lmsUserRole', 'admin');
      this.router.navigate(['/admin_homepage']);
      return;
    }

    const savedEmail = localStorage.getItem('lmsEmail');
    const savedPassword = localStorage.getItem('lmsPassword');
    if (username.toLowerCase() !== savedEmail?.toLowerCase() || password !== savedPassword) {
>>>>>>> 5b63650b3aca012379d8beb80a0cff6ad3dff0bf:src/app/login/login.page.ts
      alert('Invalid username or password.');
      return;
    }

<<<<<<< HEAD:src/app/home/home.page.ts
    localStorage.setItem('lmsDisplayName', this.username);
    this.router.navigate(['/dashboard']);
=======
    localStorage.setItem('lmsUserRole', 'reader');
    this.router.navigate(['/reader_homepage']);
>>>>>>> 5b63650b3aca012379d8beb80a0cff6ad3dff0bf:src/app/login/login.page.ts
  }

  forgotPassword(event: Event) {
    event.preventDefault();
    this.router.navigate(['/forgot-password']);
  }

}
