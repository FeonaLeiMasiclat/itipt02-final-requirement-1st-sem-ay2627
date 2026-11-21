
import { Component, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import {
  IonContent,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonBadge,
  IonModal,
  IonSearchbar
} from '@ionic/angular';

import { addIcons } from 'ionicons';

import {
  person,
  cardOutline,
  cartOutline,
  receiptOutline,
  timeOutline,
  bookOutline,
  alertCircleOutline,
  archiveOutline,
  closeOutline,
  trashOutline,
  storefrontOutline,
  checkmarkCircle,
  checkmarkDoneOutline,
  refreshOutline
} from 'ionicons/icons';

import { AuthService } from '../services/auth_service';
import { PageHeaderActions } from '../services/page-header-actions';

// Owned Book Interface
interface OwnedBook {
  id: number;
  title: string;
  author: string;
  status: string;
  dueDate: string;
}

interface ArchivedBook {
  id: number;
  title: string;
  author: string;
  returnedDate: string;
}

// Counter Order Interface
interface CounterOrder {
  id: string;
  bookTitle: string;
  counterDesk: number;
  price: number;
  status: string;
}

interface PendingCounterOrder {
  id: number;
  bookTitle: string;
  status: string;
}

interface ProfileCartItem {
  id: number;
  title: string;
  author: string;
  price: number;
  quantity: number;
  selected: boolean;
}

interface FineItem {
  id: number;
  title: string;
  daysLate: number;
  returnedDate: string;
  amount: number;
}

interface CounterPaymentSlip {
  reference: string;
  generatedAt: string;
  itemCount: number;
  total: number;
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
    IonCardContent,
    IonBadge,
    IonModal,
    IonSearchbar
  ]
})

export class ProfilePage {

  // Dependency Injection
  private router = inject(Router);
  private authService = inject(AuthService);
  private pageHeaderActions = inject(PageHeaderActions);

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
  cartItems = signal<ProfileCartItem[]>(this.loadCartItems());
  addToCartCount = computed(() =>
    this.cartItems().reduce((total, item) => total + item.quantity, 0)
  );
  cartTotal = computed(() =>
    this.cartItems().reduce((total, item) => total + item.price * item.quantity, 0)
  );
  counterOrders = signal<CounterOrder[]>([
    {
      id: 'ORD-4091',
      bookTitle: 'Chasing in the Wild',
      counterDesk: 2,
      price: 310,
      status: 'Processing'
    },
    {
      id: 'ORD-4088',
      bookTitle: 'Golden Scenery of Tomorrow',
      counterDesk: 1,
      price: 340,
      status: 'For Verification'
    }
  ]);
  counterOrderCount = computed(() => this.counterOrders().length);
  archiveSearch = signal('');

  fineItems = signal<FineItem[]>([
    {
      id: 1,
      title: 'Whispers in the Attic',
      daysLate: 2,
      returnedDate: 'Nov 19, 2026',
      amount: 15
    },
    {
      id: 2,
      title: 'Starlight Protocol',
      daysLate: 2,
      returnedDate: 'Nov 19, 2026',
      amount: 15
    },
    {
      id: 3,
      title: 'Legends of the Sun God',
      daysLate: 2,
      returnedDate: 'Nov 19, 2026',
      amount: 15
    }
  ]);
  finesDue = computed(() => this.fineItems().length);
  finesDueAmount = computed(() =>
    this.fineItems().reduce((total, fine) => total + fine.amount, 0)
  );
  counterPaymentSlip = signal<CounterPaymentSlip | null>(null);

  archivedBooks = signal<ArchivedBook[]>([
    {
      id: 5,
      title: 'Safe Skies, Archer',
      author: 'Gwy Saludes',
      returnedDate: 'Nov 21, 2026'
    }
  ]);
  archiveCount = computed(() => this.archivedBooks().length);
  filteredArchiveBooks = computed(() => {
    const search = this.archiveSearch().trim().toLowerCase();
    return this.archivedBooks().filter(book =>
      book.title.toLowerCase().includes(search) ||
      book.author.toLowerCase().includes(search)
    );
  });

  // Pending Orders
  pendingOrders = signal<PendingCounterOrder[]>([]);

  pendingCounterOrders = computed(() => {
    return this.pendingOrders().length;
  });

  // Owned Books
  ownedBooks = signal<OwnedBook[]>([
    {
      id: 2,
      title: 'The Pragmatic Programmer',
      author: 'Andrew Hunt',
      status: 'Borrowed',
      dueDate: 'Dec 05, 2026'
    },
    {
      id: 3,
      title: 'Clean Code',
      author: 'Robert C. Martin',
      status: 'Borrowed',
      dueDate: 'Dec 05, 2026'
    },
    {
      id: 1,
      title: 'The Rain in España',
      author: 'Gwy Saludes',
      status: 'Borrowed',
      dueDate: 'Dec 05, 2026'
    },
    {
      id: 4,
      title: 'Chasing in the Wild',
      author: 'Gwy Saludes',
      status: 'Borrowed',
      dueDate: 'Dec 05, 2026'
    }
  ]);
  borrowedCount = computed(() => this.ownedBooks().length);

  // Selected Statistics Section
  selectedSection = signal('');

  constructor() {

    // Register Ionic Icons
    addIcons({
      person,
      cardOutline,
      cartOutline,
      receiptOutline,
      timeOutline,
      bookOutline,
      alertCircleOutline,
      archiveOutline,
      closeOutline,
      trashOutline,
      storefrontOutline,
      checkmarkCircle,
      checkmarkDoneOutline,
      refreshOutline
    });
  }

  private loadCartItems(): ProfileCartItem[] {
    try {
      const savedCart = localStorage.getItem('cart');
      return savedCart ? JSON.parse(savedCart) as ProfileCartItem[] : [];
    } catch (error) {
      console.error('Error loading cart:', error);
      return [];
    }
  }

  private saveCartItems(): void {
    localStorage.setItem('cart', JSON.stringify(this.cartItems()));
  }

  removeCartItem(bookId: number): void {
    this.cartItems.update(items => items.filter(item => item.id !== bookId));
    this.saveCartItems();
  }

  // Show Statistics Details
  showSection(section: string) {
    this.counterPaymentSlip.set(null);
    this.selectedSection.set(section);
  }

  closeSelectedSection(): void {
    this.counterPaymentSlip.set(null);
    this.selectedSection.set('');
  }

  generateCounterPaymentSlip(): void {
    const fines = this.fineItems();
    if (fines.length === 0) {
      return;
    }

    this.counterPaymentSlip.set({
      reference: `FINE-${Date.now().toString().slice(-8)}`,
      generatedAt: new Date().toLocaleString(),
      itemCount: fines.length,
      total: this.finesDueAmount()
    });
  }

  closeFinePaymentSlip(): void {
    this.counterPaymentSlip.set(null);
  }

  updateArchiveSearch(event: CustomEvent): void {
    const value = (event.detail as { value?: string | null }).value;
    this.archiveSearch.set(value ?? '');
  }

  returnBorrowedBook(bookId: number): void {
    const book = this.ownedBooks().find(item => item.id === bookId);
    if (!book) {
      return;
    }

    this.ownedBooks.update(items => items.filter(item => item.id !== bookId));
    this.archivedBooks.update(items => [
      ...items,
      {
        id: book.id,
        title: book.title,
        author: book.author,
        returnedDate: this.formatDate(new Date())
      }
    ]);
  }

  reborrowBook(bookId: number): void {
    const book = this.archivedBooks().find(item => item.id === bookId);
    if (!book) {
      return;
    }

    this.archivedBooks.update(items => items.filter(item => item.id !== bookId));
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    this.ownedBooks.update(items => [
      ...items,
      {
        id: book.id,
        title: book.title,
        author: book.author,
        status: 'Borrowed',
        dueDate: this.formatDate(dueDate)
      }
    ]);
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    });
  }

  goShop() {
    this.router.navigateByUrl('/book-shop');
  }

  async checkoutCart(): Promise<void> {
    this.cartItems.update(items => items.map(item => ({ ...item, selected: true })));
    this.saveCartItems();

    const navigated = await this.router.navigateByUrl('/book-shop');
    if (navigated) {
      this.pageHeaderActions.shopCheckoutRequested.next();
    }
  }

  // Start Reading
  startReading(book: OwnedBook) {

    alert('Opening ' + book.title + '...');

    // Connect to Reader Page later

  }

}
