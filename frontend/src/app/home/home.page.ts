
import { Component, inject, signal } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

import { AuthService } from '../services/auth_service';

import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonBadge,
  IonModal,
  IonRouterOutlet,
  IonSearchbar,
  IonList,
  IonItem,
  IonLabel,
} from '@ionic/angular';

import { addIcons } from 'ionicons';

import {
  homeOutline,
  bagOutline,
  personOutline,
  logOutOutline,
  menuOutline,
  closeOutline,
  informationCircleOutline,
  helpCircleOutline,
  libraryOutline,
  heartOutline,
  cartOutline,
  heart,
  trashOutline
} from 'ionicons/icons';

import { PageHeaderActions } from '../services/page-header-actions';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonBadge,
    IonModal,
    IonRouterOutlet,
    IonSearchbar,
    IonList,
    IonItem,
    IonLabel
  ]
})
export class HomePage {

  private router = inject(Router);
  private authService = inject(AuthService);
  readonly pageHeaderActions = inject(PageHeaderActions);
  readonly logoutUser = this.authService.getUserData();
  readonly logoutAccountName = this.logoutUser?.user?.full_name
    || this.logoutUser?.full_name
    || this.logoutUser?.user?.username
    || this.logoutUser?.username
    || 'user';

  // Hamburger Menu State
  menuOpen = signal(false);
  wishlistOpen = signal(false);
  logoutConfirmOpen = signal(false);

  // Search Input
  menuSearch = signal('');

  // Book Genres
  readonly genres = [
    { label: 'All Genres', value: '', icon: '✨' },
    { label: 'Romance', value: 'Romance', icon: '💗' },
    { label: 'Horror', value: 'Horror', icon: '👻' },
    { label: 'Sci-fi', value: 'Sci-fi', icon: '🛸' },
    { label: 'Comedy', value: 'Comedy', icon: '🎭' },
    { label: 'Mythology', value: 'Mythology', icon: '🐉' }
  ];

  constructor() {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationStart),
        takeUntilDestroyed()
      )
      .subscribe(() => this.closeWishlist());

    addIcons({
      homeOutline,
      bagOutline,
      personOutline,
      logOutOutline,
      menuOutline,
      closeOutline,
      informationCircleOutline,
      helpCircleOutline,
      libraryOutline,
      heartOutline,
      cartOutline,
      heart,
      trashOutline
    });
  }

  // Navigate to another page
  navigateTo(path: string): void {
    this.closeMenu();
    this.router.navigateByUrl(path);
  }

  // Open and close hamburger menu
  toggleMenu(): void {
    this.menuOpen.update(open => !open);
  }

  // Close hamburger menu
  closeMenu(): void {
    this.menuOpen.set(false);
  }

  openReaderWishlist(): void {
    this.wishlistOpen.set(true);
  }

  closeWishlist(): void {
    this.wishlistOpen.set(false);
  }

  removeWishlist(bookId: number): void {
    this.pageHeaderActions.removeWishlist(bookId);
  }

  openShopCart(): void {
    this.pageHeaderActions.shopCartRequested.next();
  }

  // Update search input
  updateMenuSearch(event: CustomEvent): void {
    const value = (event.detail as { value?: string | null }).value;
    this.menuSearch.set(value ?? '');
  }

  // Search books in Book Shop
  searchFromMenu(): void {
    const searchValue = this.menuSearch().trim();

    this.router.navigate(['/book-shop'], {
      queryParams: {
        search: searchValue || null,
        genre: null
      }
    });

    this.closeMenu();
  }

  // Select book genre
  selectGenre(genre: string): void {
    this.router.navigate(['/book-shop'], {
      queryParams: {
        genre: genre || null,
        search: null
      }
    });

    this.menuSearch.set('');
    this.closeMenu();
  }

  // About Us
  showAbout(): void {
    alert(
      'Library Management System — Read, borrow, and discover your next book at Headquarters Library.'
    );
  }

  // Need Help
  showHelp(): void {
    alert(
      'Need help? Visit the library desk at Headquarters Library for assistance with searching, borrowing, or purchases.'
    );
  }

  // Check active navigation page
  isActive(path: string): boolean {
    return this.router.url.startsWith(path);
  }

  // Logout
  openLogoutConfirmation(): void {
    this.logoutConfirmOpen.set(true);
  }

  closeLogoutConfirmation(): void {
    this.logoutConfirmOpen.set(false);
  }

  confirmLogout(): void {
    this.closeLogoutConfirmation();
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }

}
