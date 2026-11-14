import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { IonContent } from '@ionic/angular';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, IonContent, RouterLink, RouterLinkActive],
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage {
  constructor(private readonly router: Router) {}
  menuOpen = false;
  logoutModalOpen = false;
  displayName = localStorage.getItem('lmsDisplayName') || 'Feona Lei Mas iclat';
  email = localStorage.getItem('lmsEmail') || 'feonaleimasiclat@gmail.com';

  toggleMenu(): void { this.menuOpen = !this.menuOpen; }
  closeMenu(): void { this.menuOpen = false; }
  openLogoutModal(): void { this.menuOpen = false; this.logoutModalOpen = true; }
  cancelLogout(): void { this.logoutModalOpen = false; }
  confirmLogout(): void {
    this.logoutModalOpen = false;
    localStorage.removeItem('lmsUserRole');
    localStorage.removeItem('lmsDisplayName');
    void this.router.navigate(['/login']);
  }
}

