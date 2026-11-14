import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular';

@Component({
  selector: 'app-admin-homepage',
  templateUrl: './admin_homepage.page.html',
  styleUrls: ['./admin_homepage.page.scss'],
  standalone: true,
  imports: [IonContent, RouterLink],
})
export class AdminHomepagePage {}
