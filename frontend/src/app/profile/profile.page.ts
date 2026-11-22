
import { Component, signal, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { finalize } from 'rxjs';
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

import { AuthService, authErrorMessage } from '../services/auth_service';
import { PageHeaderActions } from '../services/page-header-actions';
import { AppDialogService } from '../services/app-dialog.service';
import { BorrowRequest, BorrowingService } from '../services/borrowing.service';
import { ShopService } from '../services/shop.service';

type ProfileBookDetails = Pick<BorrowRequest, 'id' | 'bookTitle' | 'author'> &
  Partial<Omit<BorrowRequest, 'id' | 'bookTitle' | 'author' | 'status'>> & {
    status: BorrowRequest['status'] | 'Awaiting Pickup';
    orderId?: string;
  };

interface PurchasedBook {
  id: number;
  title: string;
  author: string;
  price: number;
  quantity: number;
  orderId: string;
  purchasedAt: string;
  status: 'Awaiting Pickup';
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
    DatePipe,
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
  readonly borrowing = inject(BorrowingService);
  readonly shop = inject(ShopService);
  private pageHeaderActions = inject(PageHeaderActions);

  userName = computed(() => this.authService.currentUser()?.fullName || 'Reader');
  userEmail = computed(() => this.authService.currentUser()?.email || 'Email not provided');
  profileDateOfBirth = computed(() => this.authService.currentUser()?.dateOfBirth ?? '');
  profileAddress = computed(() => this.authService.currentUser()?.address ?? '');
  profileEditorOpen = signal(false);
  profileEditorError = signal('');
  profileSaving = signal(false);
  editFullName = '';
  editDateOfBirth = '';
  editAddress = '';
  editEmail = '';

  readonly readerBorrowRequests = this.borrowing.requests;
  readonly changingLoan = signal(false);
  readonly purchasedBooks = computed<PurchasedBook[]>(() => this.shop.orders().flatMap(order =>
    order.items.map(item => ({ ...item, orderId: order.orderId, purchasedAt: order.date, status: order.status }))
  ));
  borrowedDetailsOpen = signal(false);
  selectedBorrowRequest = signal<ProfileBookDetails | null>(null);

  cardId = signal('LIB-2026-8812');

  // Account Statistics
  readonly cartItems = this.shop.cart;
  addToCartCount = computed(() =>
    this.cartItems().reduce((total, item) => total + item.quantity, 0)
  );
  cartTotal = computed(() =>
    this.cartItems().reduce((total, item) => total + item.price * item.quantity, 0)
  );
  readonly counterOrders = this.shop.orders;
  readonly counterOrderCount = computed(() => this.counterOrders().length);
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

  readonly archivedBooks = computed(() => this.readerBorrowRequests().filter(
    request => request.kind === 'Borrow' && request.status === 'Returned'
  ));
  archiveCount = computed(() => this.archivedBooks().length);
  filteredArchiveBooks = computed(() => {
    const search = this.archiveSearch().trim().toLowerCase();
    return this.archivedBooks().filter(book =>
      book.bookTitle.toLowerCase().includes(search) ||
      book.author.toLowerCase().includes(search)
    );
  });

  readonly ownedBooks = computed(() => this.readerBorrowRequests().filter(
    request => request.kind === 'Borrow' && (request.status === 'Approved' || request.status === 'Return Pending')
  ));
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
    const user = this.authService.currentUser();
    this.editFullName = user?.fullName ?? '';
    this.editDateOfBirth = this.profileDateOfBirth();
    this.editAddress = this.profileAddress();
    this.editEmail = user?.email ?? '';
    this.profileEditorError.set('');
    this.profileEditorOpen.set(true);
  }

  closeProfileEditor(): void {
    this.profileEditorOpen.set(false);
    this.profileEditorError.set('');
  }

  saveProfileInformation(): void {
    if (this.profileSaving()) return;
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (Number.isNaN(birthDate.getTime()) || birthDate >= today) {
      this.profileEditorError.set('Please enter a valid date of birth.');
      return;
    }

    this.profileEditorError.set('');
    this.profileSaving.set(true);
    this.authService.saveProfileInformation(profile).subscribe({
      next: () => {
        this.profileSaving.set(false);
        this.closeProfileEditor();
        this.appDialog.show('Information Updated', 'Your personal information has been updated.', 'success');
      },
      error: error => {
        this.profileSaving.set(false);
        this.profileEditorError.set(authErrorMessage(error, 'Unable to save your personal information.'));
      },
    });
  }

  formatProfileDate(value: string): string {
    if (!value) return 'Not provided';
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric'
    });
  }

  ionViewWillEnter(): void {
    this.borrowing.refresh();
    this.shop.refresh();
  }

  borrowStatusClass(status: string): string {
    return status === 'Return Pending' ? 'borrow-status-pending' : `borrow-status-${status.toLowerCase()}`;
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
      status: book.status,
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

  borrowedBookPrice(request: ProfileBookDetails): string {
    return typeof request.price === 'number' ? `₱${request.price.toFixed(2)}` : 'Not listed';
  }

  returnBorrowRequest(requestId: number): void {
    if (this.changingLoan()) return;
    this.changingLoan.set(true);
    this.borrowing.requestReturn(requestId).pipe(finalize(() => this.changingLoan.set(false))).subscribe({
      next: request => {
        this.closeBorrowedBookDetails();
        if (request.status === 'Return Pending') {
          this.appDialog.show('Return Requested', 'The library will confirm the return once it receives the book.', 'success');
        }
      },
      error: error => {
        this.closeBorrowedBookDetails();
        this.appDialog.show('Unable to request return', authErrorMessage(error, 'Please try again.'), 'warning');
      },
    });
  }

  readBorrowRequest(request: ProfileBookDetails): void {
    this.closeBorrowedBookDetails();
    this.appDialog.show(
      'Reading View Coming Soon',
      `The reading view for “${request.bookTitle}” is not available yet.`
    );
  }

  removeCartItem(bookId: number): void {
    this.shop.removeFromCart(bookId).subscribe({
      error: error => this.appDialog.show('Unable to remove book', authErrorMessage(error, 'Please try again.'), 'warning'),
    });
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

  reborrowBook(requestId: number): void {
    const book = this.archivedBooks().find(item => item.id === requestId);
    if (book?.bookId == null || book.bookStatus !== 'Active' || this.changingLoan()) return;

    this.changingLoan.set(true);
    this.borrowing.requestBook(book.bookId).pipe(finalize(() => this.changingLoan.set(false))).subscribe({
      next: () => this.appDialog.show('Request Submitted', 'Your new borrow request is pending approval.', 'success'),
      error: error => this.appDialog.show('Unable to submit request', authErrorMessage(error, 'Please try again.'), 'warning'),
    });
  }

  goShop() {
    this.router.navigateByUrl('/book-shop');
  }

  async checkoutCart(): Promise<void> {
    const navigated = await this.router.navigateByUrl('/book-shop');
    if (navigated) {
      this.pageHeaderActions.shopCheckoutRequested.next();
    }
  }


}
