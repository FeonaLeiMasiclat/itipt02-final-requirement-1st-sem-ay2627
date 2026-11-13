
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonIcon
} from '@ionic/angular';

import { addIcons } from 'ionicons';
import {
  person,
  lockClosed,
  eye,
  eyeOff
} from 'ionicons/icons';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonIcon,
    RouterLink
  ],
})
export class HomePage {

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

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  login() {
    if (!this.username || !this.password) {
      alert('Please enter your username and password.');
      return;
    }

    this.router.navigate(['/dashboard']);
  }

  forgotPassword(event: Event) {
    event.preventDefault();
    this.router.navigate(['/forgot-password']);
  }

}
