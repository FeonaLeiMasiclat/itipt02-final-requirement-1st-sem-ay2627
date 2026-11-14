import { Component, inject } from '@angular/core';
import type { OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { IonContent } from '@ionic/angular';

import { loadBorrowRequests, saveBorrowRequests } from '../shared/borrow-requests';
import type { BorrowRequest } from '../shared/borrow-requests';

type BookFilter = 'All Owned' | 'Recently Added' | 'By Series' | 'Reading Progress' | 'On Sale';

interface HomeBook {
  title: string;
  author: string;
  cover: string;
  description: string;
  rating: string;
  filters: BookFilter[];
}

@Component({
  selector: 'app-reader-homepage',
  templateUrl: './reader_homepage.page.html',
  styleUrls: ['./reader_homepage.page.scss'],
  standalone: true,
  imports: [FormsModule, IonContent, RouterLink, RouterLinkActive],
})
export class ReaderHomepagePage implements OnInit {
  private readonly router: Router = inject(Router);
  menuOpen = false;
  displayName = 'Reader';
  homeRoute = '/reader_homepage';
  acquisitionMessage = '';
  searchTerm = '';
  activeFilter: BookFilter = 'All Owned';
  readonly bookFilters: BookFilter[] = ['All Owned', 'Recently Added', 'By Series', 'Reading Progress', 'On Sale'];
  readonly favoriteBooks: HomeBook[] = [
    { title: 'His Unwritten Promise', author: 'Caleb Reed', cover: 'warm-cover', description: 'A profoundly moving and elegant reimagining of a much loved classic.', rating: '4.6 (15 reviews)', filters: ['All Owned', 'Recently Added', 'By Series', 'Reading Progress'] },
    { title: 'Dear Future Ex', author: 'Matt Kingly', cover: 'stack-cover', description: 'Between life and death there is a library of infinite second choices.', rating: '4.6 (15 reviews)', filters: ['All Owned', 'Recently Added', 'By Series'] },
  ];
  readonly purchaseBooks: HomeBook[] = [
    { title: 'How Great Books Go', author: 'Gabrielle Reyes', cover: 'gold-cover', description: 'A new title available for your library.', rating: '4.7 (22 reviews)', filters: ['On Sale'] },
    { title: 'The Midnight Library', author: 'Matt Haig', cover: 'blue-cover', description: 'A story about the choices that shape a life.', rating: '4.8 (31 reviews)', filters: ['On Sale', 'Reading Progress'] },
  ];
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

  selectFilter(filter: BookFilter): void {
    this.activeFilter = filter;
  }

  get visibleFavoriteBooks(): HomeBook[] {
    return this.filterBooks(this.favoriteBooks);
  }

  get visiblePurchaseBooks(): HomeBook[] {
    return this.filterBooks(this.purchaseBooks);
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

  private filterBooks(books: readonly HomeBook[]): HomeBook[] {
    const term = this.searchTerm.trim().toLocaleLowerCase();
    return books.filter((book) => {
      const matchesFilter = this.activeFilter === 'All Owned' ? this.favoriteBooks.includes(book) : book.filters.includes(this.activeFilter);
      const matchesSearch = !term || `${book.title} ${book.author}`.toLocaleLowerCase().includes(term);
      return matchesFilter && matchesSearch;
    });
  }
}
