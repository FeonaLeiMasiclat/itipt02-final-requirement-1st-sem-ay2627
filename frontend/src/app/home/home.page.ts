
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
  IonRouterOutlet,
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
  trashOutline,
  sparklesOutline,
  skullOutline,
  planetOutline,
  happyOutline,
  flameOutline,
  businessOutline
} from 'ionicons/icons';

import { PageHeaderActions } from '../services/page-header-actions';
import { AppDialogService } from '../services/app-dialog.service';

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
    IonRouterOutlet,
    IonList,
    IonItem,
    IonLabel
  ]
})
export class HomePage {

  private router = inject(Router);
  private authService = inject(AuthService);
  readonly pageHeaderActions = inject(PageHeaderActions);
  private appDialog = inject(AppDialogService);

  // Hamburger Menu State
  menuOpen = signal(false);
  wishlistOpen = signal(false);

  // Book Genres
  readonly genres = [
    { label: 'All Genres', value: '', icon: 'sparkles-outline' },
    { label: 'Romance', value: 'Romance', icon: 'heart-outline' },
    { label: 'Horror', value: 'Horror', icon: 'skull-outline' },
    { label: 'Sci-fi', value: 'Sci-fi', icon: 'planet-outline' },
    { label: 'Comedy', value: 'Comedy', icon: 'happy-outline' },
    { label: 'Mythology', value: 'Mythology', icon: 'flame-outline' }
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
      trashOutline,
      sparklesOutline,
      skullOutline,
      planetOutline,
      happyOutline,
      flameOutline,
      businessOutline
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

  // Select book genre
  selectGenre(genre: string): void {
    this.router.navigate(['/reader-home'], {
      queryParams: {
        genre: genre || null,
        search: null
      }
    });

    this.closeMenu();
  }

  isGenreSelected(genre: string): boolean {
    const selectedGenre = this.router.parseUrl(this.router.url).queryParams['genre'];
    return genre ? selectedGenre === genre : !selectedGenre;
  }

  // About Us
  showAbout(): void {
    this.appDialog.show(
      'About the Library',
      'Read, borrow, and discover your next book at Headquarters Library.'
    );
  }

  // Need Help
  showHelp(): void {
    this.appDialog.show(
      'Need Help?',
      'Visit the library desk at Headquarters Library for assistance with searching, borrowing, or purchases.'
    );
  }

  // Check active navigation page
  isActive(path: string): boolean {
    return this.router.url.startsWith(path);
  }

  // Logout
  openLogoutConfirmation(): void {
    this.appDialog.showConfirmation(
      'Are you sure you want to log out?',
      '',
      () => this.confirmLogout(),
      'Log Out'
    );
  }

  confirmLogout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }

}
