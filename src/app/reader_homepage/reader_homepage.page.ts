import { ChangeDetectorRef, Component, inject } from '@angular/core';
import type { OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AlertController, IonContent } from '@ionic/angular';

import { loadBorrowRequests, saveBorrowRequests } from '../shared/borrow-requests';
import type { BorrowRequest } from '../shared/borrow-requests';

@Component({
  selector: 'app-reader-homepage',
  templateUrl: './reader_homepage.page.html',
  styleUrls: ['./reader_homepage.page.scss'],
  standalone: true,
  imports: [IonContent, RouterLink],
})
export class ReaderHomepagePage implements OnInit {
  private readonly router: Router = inject(Router);
  private readonly alertController = inject(AlertController);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  menuOpen = false;
  displayName = 'Reader';
  homeRoute = '/reader_homepage';
  acquisitionMessage = '';
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

  async requestAcquisition(): Promise<void> {
    this.acquisitionMessage = '';
    const alert = await this.alertController.create({
      header: 'Request Acquisition',
      message: 'Enter the title of the book you would like to request.',
      inputs: [
        {
          name: 'bookTitle',
          type: 'text',
          placeholder: 'Book title',
          attributes: { maxlength: 100 },
        },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Send Request',
          handler: (data: unknown): boolean => {
            const bookTitle =
              typeof data === 'object' && data !== null && 'bookTitle' in data && typeof data.bookTitle === 'string'
                ? data.bookTitle.trim()
                : '';
            if (!bookTitle) {
              this.acquisitionMessage = 'Please enter a book title before sending.';
              this.changeDetectorRef.detectChanges();
              return false;
            }

            const requests: BorrowRequest[] = loadBorrowRequests();
            requests.push({
              id: `${Date.now()}`,
              bookTitle,
              requestedBy: localStorage.getItem('lmsDisplayName') || 'Reader',
              requestedAt: new Date().toISOString(),
              status: 'Pending',
            });
            saveBorrowRequests(requests);
            this.acquisitionMessage = 'Your book request was sent to the admin.';
            this.changeDetectorRef.detectChanges();
            return true;
          },
        },
      ],
    });
    await alert.present();
  }
}
