
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { IonContent, IonIcon } from '@ionic/angular';

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

@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonContent,
    IonIcon
  ]
})
export class SignupPage {

  fullName = '';
  birthDate = '';
  address = '';
  email = '';
  password = '';

  showPassword = false;

  constructor(private router: Router) {
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

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  register() {
    if (
      !this.fullName ||
      !this.birthDate ||
      !this.address ||
      !this.email ||
      !this.password
    ) {
      alert('Please complete all fields.');
      return;
    }

    alert('Registration successful! You can now log in.');

    localStorage.setItem('lmsDisplayName', this.fullName.trim());
    localStorage.setItem('lmsEmail', this.email.trim());
    this.router.navigate(['/home']);
  }
}
