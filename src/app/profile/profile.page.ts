import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { IonContent } from '@ionic/angular';

import { loadCounterOrders } from '../shared/counter-orders';
import type { CounterOrder } from '../shared/counter-orders';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, IonContent, RouterLink, RouterLinkActive],
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage {
  menuOpen = false;
  logoutModalOpen = false;
  displayName = localStorage.getItem('lmsDisplayName') || 'Feona Lei Mas iclat';
  email = localStorage.getItem('lmsEmail') || 'feonaleimasiclat@gmail.com';
  pendingOrders: CounterOrder[] = [];
  selectedReceiptOrder: CounterOrder | null = null;
  readingModalOpen = false;

  constructor(private readonly router: Router) {
    this.pendingOrders = loadCounterOrders();
  }

  get readyOrderCount(): number {
    return this.pendingOrders.length;
  }

  toggleMenu(): void { this.menuOpen = !this.menuOpen; }
  closeMenu(): void { this.menuOpen = false; }
  openLogoutModal(): void { this.menuOpen = false; this.logoutModalOpen = true; }
  cancelLogout(): void { this.logoutModalOpen = false; }
  showReceipt(order: CounterOrder): void { this.selectedReceiptOrder = order; }
  closeReceipt(): void { this.selectedReceiptOrder = null; }
  startReading(): void { this.readingModalOpen = true; }
  closeReadingModal(): void { this.readingModalOpen = false; }
  confirmLogout(): void {
    this.logoutModalOpen = false;
    localStorage.removeItem('lmsUserRole');
    localStorage.removeItem('lmsDisplayName');
    void this.router.navigate(['/login']);
  }
}

