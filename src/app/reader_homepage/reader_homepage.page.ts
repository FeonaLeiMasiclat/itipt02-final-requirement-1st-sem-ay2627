import { Component, inject } from '@angular/core';
import type { OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular';

import { loadBorrowRequests, saveBorrowRequests } from '../shared/borrow-requests';
import type { BorrowRequest } from '../shared/borrow-requests';

@Component({
  selector: 'app-reader-homepage',
  templateUrl: './reader_homepage.page.html',
  styleUrls: ['./reader_homepage.page.scss'],
  standalone: true,
  imports: [FormsModule, IonContent, RouterLink],
})
export class ReaderHomepagePage implements OnInit {
  private readonly router: Router = inject(Router);
  menuOpen = false;
  displayName = 'Reader';
  homeRoute = '/reader_homepage';
  acquisitionMessage = '';
  acquisitionModalOpen = false;
  selectedBookTitle = '';
  selectedAuthor = '';
  readonly acquisitionBooks = [
    { title: 'The Midnight Library', author: 'Matt Haig' },
    { title: 'His Unwritten Promise', author: 'Caleb Reed' },
    { title: 'Dear Future Ex', author: 'Matt Kingly' },
    { title: 'The Rain in España', author: 'Gwy Saludes' },
  ];
  logoutModalOpen = false;

  ngOnInit(): void {
    this.displayName = localStorage.getItem('lmsDisplayName') || 'Reader';
    if (localStorage.getItem('lmsUserRole') === 'admin') {
      this.homeRoute = '/admin_homepage';
      this.router.navigate([this.homeRoute]);
    }
  }

  goToShop(): void {
    this.router.navigate(['/shop']);
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  openLogoutModal(): void {
    this.menuOpen = false;
    this.logoutModalOpen = true;
  }

  cancelLogout(): void {
    this.logoutModalOpen = false;
  }

  confirmLogout(): void {
    this.logoutModalOpen = false;
    localStorage.removeItem('lmsUserRole');
    localStorage.removeItem('lmsDisplayName');
    void this.router.navigate(['/login']);
  }

  requestAcquisition(): void {
    this.acquisitionMessage = '';
    this.selectedBookTitle = '';
    this.selectedAuthor = '';
    this.acquisitionModalOpen = true;
  }

  cancelAcquisition(): void {
    this.acquisitionModalOpen = false;
  }

  submitAcquisition(): void {
    if (!this.selectedBookTitle || !this.selectedAuthor) {
      this.acquisitionMessage = 'Please select both a book title and an author.';
      return;
    }

    const requests: BorrowRequest[] = loadBorrowRequests();
    requests.push({
      id: `${Date.now()}`,
      bookTitle: this.selectedBookTitle,
      author: this.selectedAuthor,
      requestedBy: localStorage.getItem('lmsDisplayName') || 'Reader',
      requestedAt: new Date().toISOString(),
      status: 'Pending',
    });
    saveBorrowRequests(requests);
    this.acquisitionModalOpen = false;
    this.acquisitionMessage = 'Your book request was sent to the admin.';
  }
}
