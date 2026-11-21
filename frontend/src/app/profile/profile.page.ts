
import { Component, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import {
  IonContent,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonBadge,
  IonCardTitle
} from '@ionic/angular';

import { addIcons } from 'ionicons';

import {
  personCircle,
  timeOutline,
  bookOutline
} from 'ionicons/icons';

import { AuthService } from '../services/auth_service';

// Owned Book Interface
interface OwnedBook {
  id: number;
  title: string;
  author: string;
  status: string;
}

// Counter Order Interface
interface CounterOrder {
  id: number;
  bookTitle: string;
  status: string;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,

  imports: [
    IonContent,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardContent,
    IonBadge,
    IonCardTitle
  ]
})

export class ProfilePage {

  // Dependency Injection
  private router = inject(Router);
  private authService = inject(AuthService);

  // Get Saved User Information
  private savedUser = this.authService.getUserData();

  // Component Properties
  userName = signal(
    this.savedUser?.user?.full_name ||
    this.savedUser?.full_name ||
    'user'
  );

  userEmail = signal(
    this.savedUser?.user?.email ||
    this.savedUser?.email ||
    'user@gmail.com'
  );

  cardId = signal('LIB-2026-8812');

  // Account Statistics
  addToCartCount = signal(16);
  counterOrderCount = signal(2);
  borrowedCount = signal(6);
  finesDue = signal(3);
  archiveCount = signal(10);

  finesDueAmount = signal(150);

  // Pending Orders
  pendingOrders = signal<CounterOrder[]>([]);

  pendingCounterOrders = computed(() => {
    return this.pendingOrders().length;
  });

  // Owned Books
  ownedBooks = signal<OwnedBook[]>([

    {
      id: 1,
      title: 'The Rain in España',
      author: 'Gwy Saludes',
      status: 'Borrowed'
    }

  ]);

  // Selected Statistics Section
  selectedSection = signal('');

  // Dynamic Section Title
  sectionTitle = computed(() => {

    switch (this.selectedSection()) {

      case 'cart':
        return 'Add to Cart';

      case 'counter':
        return 'Counter Orders';

      case 'borrowed':
        return 'Borrowed Books';

      case 'fines':
        return 'Fines Due';

      case 'archive':
        return 'Archived Books';

      default:
        return '';

    }

  });

  constructor() {

    // Register Ionic Icons
    addIcons({
      personCircle,
      timeOutline,
      bookOutline
    });

  }

  // Show Statistics Details
  showSection(section: string) {

    this.selectedSection.set(section);

  }

  goShop() {
    this.router.navigateByUrl('/book-shop');
  }

  // Start Reading
  startReading(book: OwnedBook) {

    alert('Opening ' + book.title + '...');

    // Connect to Reader Page later

  }

}
