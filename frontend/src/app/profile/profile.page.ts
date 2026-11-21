
import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  IonContent,
  IonButton,
  IonIcon,
  IonCard,
  IonBadge,
  IonModal,
  IonSearchbar,
  IonInput,
  IonTextarea
} from '@ionic/angular';

import { addIcons } from 'ionicons';

import {
  person,
  calendarOutline,
  homeOutline,
  mailOutline,
  createOutline,
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
import { AppDialogService } from '../services/app-dialog.service';

// Owned Book Interface
interface OwnedBook {
  id: number;
  title: string;
  author: string;
  status: string;
  dueDate: string;
}

interface BorrowRequest {
  id: number;
  bookTitle: string;
  reader: string;
  status: string;
  requestedAt?: string;
  returnedAt?: string;
  author?: string;
  genre?: string;
  availableCopies?: number;
  price?: number;
  rating?: number;
  reviews?: number;
  synopsis?: string;
  orderId?: string;
}

interface PurchasedBook {
  id: number;
  title: string;
  author: string;
  price: number;
  quantity: number;
  orderId: string;
  purchasedAt: string;
}

interface PurchaseHistoryOrder {
  orderId: string;
  date: string;
  purchasedBy?: string;
  items: Array<{
    id: number;
    title: string;
    author: string;
    price: number;
    quantity: number;
  }>;
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
    FormsModule,
    IonContent,
    IonButton,
    IonIcon,
    IonCard,
    IonBadge,
    IonModal,
    IonSearchbar,
    IonInput,
    IonTextarea
  ]
})

export class ProfilePage {
  private appDialog = inject(AppDialogService);

  // Dependency Injection
  private router = inject(Router);
  private authService = inject(AuthService);
  private pageHeaderActions = inject(PageHeaderActions);

  // Get Saved User Information
  private savedUser = this.authService.getUserData();
  private savedProfile = this.authService.getProfileInformation();
  private readonly currentReader = this.savedUser?.user?.username ||
    this.savedUser?.username || this.savedUser?.user?.full_name || this.savedUser?.full_name || '';

  // Component Properties
  userName = signal(
    this.savedProfile.fullName ||
    this.savedUser?.user?.full_name ||
    this.savedUser?.full_name ||
    this.savedUser?.username ||
    'Reader'
  );

  userEmail = signal(
    this.savedProfile.email ||
    this.savedUser?.user?.email ||
    this.savedUser?.email ||
    'Email not provided'
  );

  profileDateOfBirth = signal(this.savedProfile.dateOfBirth);
  profileAddress = signal(this.savedProfile.address);
  profileEditorOpen = signal(false);
  profileEditorError = signal('');
  editFullName = '';
  editDateOfBirth = '';
  editAddress = '';
  editEmail = '';

  borrowRequests = signal<BorrowRequest[]>(this.loadBorrowRequests());
  purchasedBooks = signal<PurchasedBook[]>(this.loadPurchasedBooks());
  borrowedDetailsOpen = signal(false);
  selectedBorrowRequest = signal<BorrowRequest | null>(null);
  readerBorrowRequests = computed(() => this.borrowRequests()
    .filter(request => request.reader === this.currentReader)
    .sort((a, b) => b.id - a.id));
  approvedBorrowCount = computed(() =>
    this.readerBorrowRequests().filter(request => request.status === 'Approved').length
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
      calendarOutline,
      homeOutline,
      mailOutline,
      createOutline,
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

  openProfileEditor(): void {
    this.editFullName = this.userName() === 'Reader' ? '' : this.userName();
    this.editDateOfBirth = this.profileDateOfBirth();
    this.editAddress = this.profileAddress();
    this.editEmail = this.userEmail() === 'Email not provided' ? '' : this.userEmail();
    this.profileEditorError.set('');
    this.profileEditorOpen.set(true);
  }

  closeProfileEditor(): void {
    this.profileEditorOpen.set(false);
    this.profileEditorError.set('');
  }

  saveProfileInformation(): void {
    const profile = {
      fullName: this.editFullName.trim(),
      dateOfBirth: this.editDateOfBirth,
      address: this.editAddress.trim(),
      email: this.editEmail.trim()
    };
    if (!profile.fullName || !profile.dateOfBirth || !profile.address || !profile.email) {
      this.profileEditorError.set('Please complete all personal information fields.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      this.profileEditorError.set('Please enter a valid email address.');
      return;
    }
    const birthDate = new Date(`${profile.dateOfBirth}T00:00:00`);
    if (Number.isNaN(birthDate.getTime()) || birthDate >= new Date()) {
      this.profileEditorError.set('Please enter a valid date of birth.');
      return;
    }

    this.authService.saveProfileInformation(profile);
    this.userName.set(profile.fullName);
    this.userEmail.set(profile.email);
    this.profileDateOfBirth.set(profile.dateOfBirth);
    this.profileAddress.set(profile.address);
    this.closeProfileEditor();
    this.appDialog.show('Information Updated', 'Your personal information has been updated.', 'success');
  }

  formatProfileDate(value: string): string {
    if (!value) return 'Not provided';
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric'
    });
  }

  private loadBorrowRequests(): BorrowRequest[] {
    try {
      const requests = JSON.parse(localStorage.getItem('borrowRequests') || '[]');
      const savedRequests = Array.isArray(requests) ? requests as BorrowRequest[] : [];
      const sampleId = 999_001;
      if (this.currentReader && !savedRequests.some(request => request.id === sampleId)) {
        savedRequests.unshift({
          id: sampleId,
          bookTitle: 'The Great Gatsby',
          author: 'F. Scott Fitzgerald',
          reader: this.currentReader,
          status: 'Approved',
          requestedAt: this.formatDate(new Date()),
          genre: 'Romance',
          availableCopies: 10,
          price: 350,
          rating: 4.8,
          reviews: 120,
          synopsis: 'A young dreamer enters the glittering world of the Jazz Age, where ambition, love, and the past collide.'
        });
        localStorage.setItem('borrowRequests', JSON.stringify(savedRequests));
      }
      return savedRequests;
    } catch {
      return [];
    }
  }

  private loadPurchasedBooks(): PurchasedBook[] {
    try {
      const savedOrders = JSON.parse(localStorage.getItem('orderHistory') || '[]');
      const orders = Array.isArray(savedOrders) ? savedOrders as PurchaseHistoryOrder[] : [];

      const purchasedBooks = orders
        .filter(order => !order.purchasedBy || order.purchasedBy === this.currentReader)
        .flatMap(order => (order.items || []).map((item, index) => ({
          id: item.id ?? index,
          title: item.title,
          author: item.author,
          price: item.price,
          quantity: item.quantity,
          orderId: order.orderId,
          purchasedAt: order.date
        })))
        .reverse();

      const sampleBook: PurchasedBook = {
        id: -2002,
        title: 'How Great Books Go',
        author: 'Gabriella Smith',
        price: 360,
        quantity: 1,
        orderId: `DEMO-${this.currentReader || 'READER'}-002`,
        purchasedAt: new Date().toLocaleString()
      };

      if (purchasedBooks.length > 0) {
        return [...purchasedBooks, sampleBook];
      }

      return [
        {
          ...sampleBook,
          id: -2001,
          title: 'The Great Gatsby',
          author: 'F. Scott Fitzgerald',
          price: 350,
          orderId: `DEMO-${this.currentReader || 'READER'}-001`
        },
        sampleBook
      ];
    } catch {
      return [];
    }
  }

  borrowStatusClass(status: string): string {
    const normalizedStatus = status === 'Rejected' ? 'Declined' : status;
    return `borrow-status-${normalizedStatus.toLowerCase()}`;
  }

  borrowStatusLabel(status: string): string {
    return status === 'Rejected' ? 'Declined' : status;
  }

  openBorrowedBookDetails(request: BorrowRequest): void {
    this.selectedBorrowRequest.set(request);
    this.borrowedDetailsOpen.set(true);
  }

  openPurchasedBookDetails(book: PurchasedBook): void {
    this.selectedBorrowRequest.set({
      id: book.id,
      bookTitle: book.title,
      author: book.author,
      reader: this.currentReader,
      status: 'Purchased',
      requestedAt: book.purchasedAt,
      price: book.price,
      orderId: book.orderId
    });
    this.borrowedDetailsOpen.set(true);
  }

  closeBorrowedBookDetails(): void {
    this.borrowedDetailsOpen.set(false);
    this.selectedBorrowRequest.set(null);
  }

  starsFor(rating: number): string {
    const filledStars = Math.max(0, Math.min(5, Math.round(rating)));
    return '★'.repeat(filledStars) + '☆'.repeat(5 - filledStars);
  }

  borrowedBookPrice(request: BorrowRequest): string {
    return typeof request.price === 'number' ? `₱${request.price.toFixed(2)}` : 'Not listed';
  }

  returnBorrowRequest(requestId: number): void {
    const request = this.borrowRequests().find(item => item.id === requestId);
    if (!request || request.status !== 'Approved') return;

    const updated = this.borrowRequests().map(item => item.id === requestId
      ? { ...item, status: 'Returned', returnedAt: this.formatDate(new Date()) }
      : item);
    this.borrowRequests.set(updated);
    localStorage.setItem('borrowRequests', JSON.stringify(updated));
  }

  borrowedAuthor(request: BorrowRequest): string {
    if (request.author?.trim()) return request.author;

    const title = request.bookTitle.trim().toLowerCase();
    const readerBookAuthors: Record<string, string> = {
      'his unwritten promise': 'Cy Caleb Reid',
      'dear future ex': 'Sky Mel Kordy',
      'how great books go': 'Gabriella Smith',
      'the midnight library': 'Matt Haig',
      'the house beyond the fog': 'Mara Ellery',
      'the last olympian': 'R. J. Calloway'
    };
    const knownAuthor = readerBookAuthors[title];
    if (knownAuthor) return knownAuthor;

    try {
      const adminBooks = JSON.parse(localStorage.getItem('adminBooks') || '[]') as Array<{
        title?: string;
        author?: string;
      }>;
      return adminBooks.find(book => book.title?.trim().toLowerCase() === title)?.author
        || 'Author details unavailable';
    } catch {
      return 'Author details unavailable';
    }
  }

  readBorrowRequest(request: BorrowRequest): void {
    this.closeBorrowedBookDetails();
    this.appDialog.show(
      'Reading View Coming Soon',
      `The reading view for “${request.bookTitle}” is not available yet.`
    );
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
    this.appDialog.show(
      'Reading View Coming Soon',
      'The reading view for “' + book.title + '” is not available yet.'
    );
  }

}
