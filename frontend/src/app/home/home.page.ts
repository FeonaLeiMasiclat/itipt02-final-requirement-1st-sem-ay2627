
import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService, authErrorMessage } from '../services/auth_service';
import { ShopService } from '../services/shop.service';

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
  private readonly currentPath = signal(this.router.url);
  private authService = inject(AuthService);
  readonly shop = inject(ShopService);
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
      .pipe(takeUntilDestroyed())
      .subscribe(event => {
        if (event instanceof NavigationStart) this.closeWishlist();
        if (event instanceof NavigationEnd) this.currentPath.set(event.urlAfterRedirects);
      });

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
    this.shop.refresh();
    this.wishlistOpen.set(true);
  }

  closeWishlist(): void {
    this.wishlistOpen.set(false);
  }

  removeWishlist(bookId: number): void {
    this.shop.setWishlisted(bookId, false).subscribe({
      error: error => this.appDialog.show('Unable to update wishlist', authErrorMessage(error, 'Please try again.'), 'warning'),
    });
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
    return this.currentPath().startsWith(path);
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
    void this.router.navigateByUrl('/login', { replaceUrl: true });
  }

}
