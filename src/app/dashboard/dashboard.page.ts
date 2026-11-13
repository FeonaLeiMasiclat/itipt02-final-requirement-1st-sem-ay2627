import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, RouterLink],
})
export class DashboardPage {
  menuOpen = false;
  displayName = 'Reader';

  ngOnInit() {
    this.displayName = localStorage.getItem('lmsDisplayName') || 'Reader';
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
