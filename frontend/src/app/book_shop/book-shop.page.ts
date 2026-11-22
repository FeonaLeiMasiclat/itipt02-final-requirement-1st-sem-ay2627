
import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PageHeaderActions } from '../services/page-header-actions';
import { authErrorMessage } from '../services/auth_service';
import { BorrowingService } from '../services/borrowing.service';
import { finalize, Observable } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { CartItem, Checkout, ShopOrder, ShopService } from '../services/shop.service';
import { AppDialogService } from '../services/app-dialog.service';
import { BookCatalogService } from '../services/book-catalog.service';

import {
  IonContent,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonSearchbar,
  IonCheckbox,
  IonModal
} from '@ionic/angular';

import { addIcons } from 'ionicons';
import {
  cartOutline,
  libraryOutline,
  addCircleOutline,
  bookOutline,
  closeOutline,
  trashOutline,
  arrowForward,
  star,
  cashOutline,
  checkmarkCircle,
  checkmark,
  addOutline,
  removeOutline
} from 'ionicons/icons';

interface Book {
  id: number;
  title: string;
  author: string;
  price: number;
  rating: number;
  reviews: number;
  genre: string;
  availableCopies: number;
  synopsis?: string;
}

type SelectedCartItem = CartItem & { selected: boolean };

@Component({
  selector: 'app-book-shop',
  templateUrl: './book-shop.page.html',
  styleUrls: ['./book-shop.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonButton,
    IonIcon,
    IonCard,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonSearchbar,
    IonCheckbox,
    IonModal
  ]
})
export class BookShopPage {
  private route = inject(ActivatedRoute);
  private pageHeaderActions = inject(PageHeaderActions);
  readonly shop = inject(ShopService);
  private borrowing = inject(BorrowingService);
  readonly sendingRequest = signal(false);
  private appDialog = inject(AppDialogService);
  selectedGenre = signal('');
  detailsOpen = signal(false);
  selectedBook = signal<Book | null>(null);

  // Search
  searchText = '';
  searchQuery = signal('');

  readonly catalog = inject(BookCatalogService);
  readonly books = computed<Book[]>(() => this.catalog.books()
    .filter(book => book.status === 'Active')
    .map(book => ({
      id: book.id,
      title: book.title,
      author: book.author,
      price: book.price,
      rating: book.rating,
      reviews: book.reviews,
      genre: book.genre,
      availableCopies: book.copies,
      synopsis: book.synopsis
    })));
  booksForSelectedGenre = computed(() => {
    const genre = this.selectedGenre();
    return this.books().filter(book => !genre || book.genre === genre);
  });

  reservedGridHeight = computed(() => {
    const rows = Math.ceil(this.books().length / 2);
    return rows * 310 + Math.max(0, rows - 1) * 12;
  });

  // Filtered books
  filteredBooks = computed(() => {
    const search = this.searchQuery().toLowerCase().trim();

    return this.booksForSelectedGenre().filter(book =>
      !search || book.title.toLowerCase().includes(search) ||
        book.author.toLowerCase().includes(search)
    );
  });

  private readonly unselectedBookIds = signal<number[]>([]);
  readonly cart = computed(() => this.shop.cart().map(item => ({
    ...item, selected: !this.unselectedBookIds().includes(item.id),
  })));
  readonly directCheckoutItem = signal<SelectedCartItem | null>(null);
  readonly cartBusy = signal(false);
  readonly checkoutBusy = signal(false);
  readonly checkoutError = signal('');
  private checkoutAttempt: { selection: string; key: string } | null = null;

  showCart = signal(false);
  showCheckout = signal(false);
  showReceipt = signal(false);
  orderReceipt = signal<ShopOrder | null>(null);

  // Selected cart item count
  selectedItems = computed(() => {
    return this.cart()
      .filter(item => item.selected)
      .reduce((total, item) => total + item.quantity, 0);
  });

  // Total of selected cart items
  totalAmount = computed(() => {
    return this.cart()
      .filter(item => item.selected)
      .reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );
  });

  // Items to be checked out
  checkoutItems = computed(() => {
    const directItem = this.directCheckoutItem();
    if (directItem) return [directItem];
    return this.cart().filter(item => item.selected);
  });

  checkoutTotal = computed(() => {
    return this.checkoutItems().reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  });

  checkoutCount = computed(() => {
    return this.checkoutItems().reduce(
      (total, item) => total + item.quantity,
      0
    );
  });

  constructor() {

    this.pageHeaderActions.shopCartRequested
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.openCart());

    this.pageHeaderActions.shopCheckoutRequested
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.unselectedBookIds.set([]);
        this.proceedToCheckout();
      });

    this.route.queryParamMap.subscribe(params => {
      const search = params.get('search') ?? '';
      this.searchText = search;
      this.searchQuery.set(search);
      this.selectedGenre.set(params.get('genre') ?? '');
    });

    addIcons({
      cartOutline,
      libraryOutline,
      addCircleOutline,
      bookOutline,
      closeOutline,
      trashOutline,
      arrowForward,
      star,
      cashOutline,
      checkmarkCircle,
      checkmark,
      addOutline,
      removeOutline
    });
  }

  ionViewWillEnter(): void {
    this.catalog.refresh();
    this.shop.refresh();
  }

  // Search books
  searchBooks(value: string | null | undefined): void {
    this.searchQuery.set(value || '');
  }

  // Scroll to the book section
  scrollToBooks(): void {
    document.getElementById('books-section')?.scrollIntoView({
      behavior: 'smooth'
    });
  }

  addToCartWithConfirmation(book: Book, closeDetails = false): void {
    this.updateCart(() => this.shop.changeCart(book.id, 1), () => {
      this.toggleCartSelection(book.id, true);
      if (closeDetails) this.closeBookDetails();
      this.showAddedToCartMessage(book);
    });
  }

  private showAddedToCartMessage(book: Book): void {
    this.appDialog.show(
      'Added to Shopping Cart',
      `"${book.title}" has been added to your shopping cart.`,
      'success'
    );
  }

  openBookDetails(book: Book): void {
    this.selectedBook.set(book);
    this.detailsOpen.set(true);
  }

  closeBookDetails(): void {
    this.detailsOpen.set(false);
  }

  starsFor(rating: number): string {
    const filledStars = Math.max(0, Math.min(5, Math.round(rating)));
    return String.fromCharCode(9733).repeat(filledStars)
      + String.fromCharCode(9734).repeat(5 - filledStars);
  }

  borrowBook(book: Book): void {
    if (this.sendingRequest()) return;
    this.sendingRequest.set(true);
    this.borrowing.requestBook(book.id).pipe(finalize(() => this.sendingRequest.set(false))).subscribe({
      next: request => {
        this.closeBookDetails();
        this.appDialog.show('Request Submitted', `Your request to borrow "${request.bookTitle}" has been submitted.`, 'success');
      },
      error: error => {
        this.closeBookDetails();
        this.appDialog.show('Unable to submit request', authErrorMessage(error, 'Please try again.'), 'warning');
      },
    });
  }

  buyNow(book: Book): void {
    if (this.checkoutBusy() || book.availableCopies === 0) return;
    this.directCheckoutItem.set({
      id: book.id, title: book.title, author: book.author, price: book.price,
      availableCopies: book.availableCopies, status: 'Active', quantity: 1, selected: true,
    });
    this.checkoutError.set('');
    this.showCart.set(false);
    this.showCheckout.set(true);
  }

  openCart(): void {
    this.shop.refresh();
    this.showCart.set(true);
  }

  toggleCartSelection(bookId: number, checked: boolean): void {
    this.unselectedBookIds.update(ids => checked ? ids.filter(id => id !== bookId) : [...ids, bookId]);
  }

  removeCart(bookId: number): void {
    this.updateCart(() => this.shop.removeFromCart(bookId), () => this.toggleCartSelection(bookId, true));
  }

  increaseQuantity(bookId: number): void {
    this.changeQuantity(bookId, 1);
  }

  decreaseQuantity(bookId: number): void {
    this.changeQuantity(bookId, -1);
  }

  private changeQuantity(bookId: number, delta: -1 | 1): void {
    if (this.checkoutBusy()) return;
    const directItem = this.directCheckoutItem();
    if (directItem?.id === bookId) {
      const quantity = directItem.quantity + delta;
      if (quantity >= 1 && quantity <= directItem.availableCopies) {
        this.directCheckoutItem.set({ ...directItem, quantity });
      }
      return;
    }
    this.updateCart(() => this.shop.changeCart(bookId, delta));
  }

  private updateCart(action: () => Observable<CartItem[]>, done?: () => void): void {
    if (this.cartBusy() || this.checkoutBusy()) return;
    this.checkoutError.set('');
    this.cartBusy.set(true);
    action().pipe(finalize(() => this.cartBusy.set(false))).subscribe({
      next: () => done?.(),
      error: error => {
        const message = authErrorMessage(error, 'Unable to update your cart. Please try again.');
        if (this.showCheckout()) {
          this.checkoutError.set(message);
        } else {
          this.appDialog.show('Unable to update cart', message, 'warning');
        }
        this.shop.refresh();
      },
    });
  }

  // Close cart drawer
  closeDrawers(): void {
    this.showCart.set(false);
  }

  // Open checkout modal
  proceedToCheckout(): void {
    if (this.selectedItems() === 0) {
      this.appDialog.show(
        'Select a Book',
        'Please select at least one book before checkout.',
        'warning'
      );
      return;
    }

    this.showCart.set(false);
    this.directCheckoutItem.set(null);
    this.checkoutError.set('');
    this.showCheckout.set(true);
  }

  confirmOrder(): void {
    if (this.checkoutBusy() || this.cartBusy()) return;
    const items = this.checkoutItems().map(item => ({ bookId: item.id, quantity: item.quantity }));
    if (items.length === 0) {
      this.checkoutError.set('Your checkout list is empty.');
      return;
    }

    const data: Checkout = {
      source: this.directCheckoutItem() ? 'direct' : 'cart',
      items: items.sort((a, b) => a.bookId - b.bookId),
    };
    const selection = JSON.stringify(data);
    if (this.checkoutAttempt?.selection !== selection) {
      this.checkoutAttempt = { selection, key: crypto.randomUUID() };
    }
    this.checkoutError.set('');
    this.checkoutBusy.set(true);
    this.shop.checkout(data, this.checkoutAttempt.key).pipe(
      finalize(() => this.checkoutBusy.set(false)),
    ).subscribe({
      next: order => {
        this.checkoutAttempt = null;
        this.orderReceipt.set(order);
        this.showCheckout.set(false);
        this.directCheckoutItem.set(null);
        this.showReceipt.set(true);
      },
      error: error => {
        this.checkoutError.set(authErrorMessage(error, 'Unable to save the order. Please try again.'));
        if (error instanceof HttpErrorResponse && error.status === 409) {
          this.shop.refresh();
          this.catalog.refresh();
        }
      },
    });
  }

  closeCheckout(): void {
    if (this.checkoutBusy()) return;
    this.showCheckout.set(false);
    this.directCheckoutItem.set(null);
  }

  closeReceipt(): void {
    this.showReceipt.set(false);
    this.orderReceipt.set(null);
  }

  // Request book acquisition
  requestAcquisition(): void {
    this.appDialog.show(
      'Coming Soon',
      'Book acquisition requests will be available in a future update.'
    );
  }
}
