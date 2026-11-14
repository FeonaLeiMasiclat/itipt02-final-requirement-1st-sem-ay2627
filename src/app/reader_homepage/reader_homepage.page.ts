import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular';

@Component({
  selector: 'app-reader-homepage',
  templateUrl: './reader_homepage.page.html',
  styleUrls: ['./reader_homepage.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, RouterLink],
})
export class ReaderHomepagePage {
  menuOpen = false;
  displayName = 'Reader';
  homeRoute = '/reader_homepage';

  ngOnInit() {
    this.displayName = localStorage.getItem('lmsDisplayName') || 'Reader';
    if (localStorage.getItem('lmsUserRole') === 'admin') {
      this.homeRoute = '/admin_homepage';
      this.router.navigate([this.homeRoute]);
    }
  }

  constructor(private router: Router) {}

  goToShop() {
    this.router.navigate(['/shop']);
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
  }
}
