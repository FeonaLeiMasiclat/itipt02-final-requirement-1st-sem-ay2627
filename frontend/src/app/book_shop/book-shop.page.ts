
import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PageHeaderActions } from '../services/page-header-actions';
import { AuthService } from '../services/auth_service';
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

interface CartItem {
  id: number;
  title: string;
  author: string;
  price: number;
  quantity: number;
  selected: boolean;
}

interface OrderReceipt {
  orderId: string;
  purchasedBy: string;
  items: CartItem[];
  total: number;
  paymentMethod: string;
  counter: number;
  date: string;
}

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
  private authService = inject(AuthService);
  private appDialog = inject(AppDialogService);
  readonly username = this.authService.getUserData()?.user?.username
    || this.authService.getUserData()?.username
    || 'Reader';
  selectedGenre = signal('');
  detailsOpen = signal(false);
  selectedBook = signal<Book | null>(null);

  // Search
  searchText = '';
  searchQuery = signal('');

  private catalog = inject(BookCatalogService);
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

  // Cart

  cart = signal<CartItem[]>(
    this.loadData<CartItem[]>('cart', [])
  );
  directCheckoutItem = signal<CartItem | null>(null);

  // Cart drawer visibility
  showCart = signal(false);

  // Checkout and receipt visibility
  showCheckout = signal(false);
  showReceipt = signal(false);

  // Payment method
  paymentMethod = signal('Counter Cash');

  // Receipt
  orderReceipt = signal<OrderReceipt | null>(null);

  // Number of items in cart, including quantities
  cartCount = computed(() => {
    return this.cart().reduce(
      (total, item) => total + item.quantity,
      0
    );
  });

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
      .subscribe(() => this.proceedToCheckout());

    this.route.queryParamMap.subscribe(params => {
      const search = params.get('search') ?? '';
      this.searchText = search;
      this.searchQuery.set(search);
      this.selectedGenre.set(params.get('genre') ?? '');
    });

    effect(() => {
      this.pageHeaderActions.shopCartCount.set(this.cartCount());
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

  // Load data from localStorage
  loadData<T>(key: string, defaultValue: T): T {
    try {
      const savedData = localStorage.getItem(key);

      if (savedData) {
        return JSON.parse(savedData) as T;
      }

      return defaultValue;
    } catch (error) {
      console.error('Error loading data:', error);
      return defaultValue;
    }
  }

  // Save cart
  saveCart(): void {
    localStorage.setItem('cart', JSON.stringify(this.cart()));
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

  // Add book to cart
  addToCart(book: Book): void {
    const existingItem = this.cart().find(item => item.id === book.id);

    if (existingItem) {
      this.cart.update(items =>
        items.map(item =>
          item.id === book.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      const newItem: CartItem = {
        id: book.id,
        title: book.title,
        author: book.author,
        price: book.price,
        quantity: 1,
        selected: true
      };

      this.cart.update(items => [...items, newItem]);
    }

    this.saveCart();
  }

  addToCartWithConfirmation(book: Book): void {
    this.addToCart(book);
    this.showAddedToCartMessage(book);
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
    const requests = this.loadData<any[]>('borrowRequests', []);
    if (requests.some(request => request.bookTitle === book.title
      && request.reader === this.username && request.status === 'Pending')) {
      this.closeBookDetails();
      this.appDialog.show(
        'Request Already Pending',
        'You already have a pending request for this book.',
        'warning'
      );
      return;
    }

    requests.unshift({
      id: Date.now(),
      bookTitle: book.title,
      author: book.author,
      genre: book.genre,
      availableCopies: book.availableCopies,
      price: book.price,
      rating: book.rating,
      reviews: book.reviews,
      synopsis: book.synopsis,
      reader: this.username,
      status: 'Pending',
      requestedAt: new Date().toLocaleString()
    });
    localStorage.setItem('borrowRequests', JSON.stringify(requests));
    this.closeBookDetails();
    this.appDialog.show(
      'Request Submitted',
      `Your request to borrow "${book.title}" has been submitted.`,
      'success'
    );
  }

  addSelectedBookToCart(book: Book): void {
    this.addToCart(book);
    this.closeBookDetails();
    this.showAddedToCartMessage(book);
  }

  // Buy now
  buyNow(book: Book): void {
    this.directCheckoutItem.set({
      id: book.id,
      title: book.title,
      author: book.author,
      price: book.price,
      quantity: 1,
      selected: true
    });
    this.showCart.set(false);
    this.showCheckout.set(true);
  }

  // Open cart
  openCart(): void {
    this.showCart.set(true);
  }

  // Select or unselect cart item
  toggleCartSelection(bookId: number, checked: boolean): void {
    this.cart.update(items =>
      items.map(item =>
        item.id === bookId
          ? { ...item, selected: checked }
          : item
      )
    );

    this.saveCart();
  }

  // Remove item from cart
  removeCart(bookId: number): void {
    this.cart.update(items =>
      items.filter(item => item.id !== bookId)
    );

    this.saveCart();
  }

  // Increase quantity
  increaseQuantity(bookId: number): void {
    const directItem = this.directCheckoutItem();
    if (directItem?.id === bookId) {
      this.directCheckoutItem.update(item => item
        ? { ...item, quantity: item.quantity + 1 }
        : null);
      return;
    }

    this.cart.update(items =>
      items.map(item =>
        item.id === bookId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );

    this.saveCart();
  }

  // Decrease quantity
  decreaseQuantity(bookId: number): void {
    const directItem = this.directCheckoutItem();
    if (directItem?.id === bookId) {
      this.directCheckoutItem.update(item => item
        ? { ...item, quantity: Math.max(1, item.quantity - 1) }
        : null);
      return;
    }

    this.cart.update(items =>
      items.map(item =>
        item.id === bookId
          ? {
              ...item,
              quantity: Math.max(1, item.quantity - 1)
            }
          : item
      )
    );

    this.saveCart();
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
    this.showCheckout.set(true);
  }

  // Confirm order and create receipt
  confirmOrder(): void {
    const itemsToPurchase = this.checkoutItems();

    if (itemsToPurchase.length === 0) {
      this.appDialog.show('Cart is Empty', 'Your checkout list is empty.', 'warning');
      return;
    }

    const currentYear = new Date().getFullYear();

    let orderCounter = parseInt(
      localStorage.getItem('orderCounter') || '0',
      10
    );

    orderCounter++;

    localStorage.setItem('orderCounter', orderCounter.toString());

    const orderId =
      'LMS-' +
      currentYear +
      '-' +
      orderCounter.toString().padStart(4, '0');

    const receipt: OrderReceipt = {
      orderId: orderId,
      purchasedBy: this.username,
      items: itemsToPurchase.map(item => ({ ...item })),
      total: this.checkoutTotal(),
      paymentMethod: this.paymentMethod(),
      counter: orderCounter,
      date: new Date().toLocaleString()
    };

    this.orderReceipt.set(receipt);

    localStorage.setItem(
      'lastOrderReceipt',
      JSON.stringify(receipt)
    );

    this.showCheckout.set(false);
    this.showReceipt.set(true);
  }

  // Finish order
  finishOrder(): void {
    const receipt = this.orderReceipt();
    const isDirectPurchase = this.directCheckoutItem() !== null;

    if (receipt) {
      if (!isDirectPurchase) {
        const purchasedIds = receipt.items.map(item => item.id);
        this.cart.update(items =>
          items.filter(item => !purchasedIds.includes(item.id))
        );
        this.saveCart();
      }

      // Save order to order history
      const orderHistory = this.loadData<OrderReceipt[]>(
        'orderHistory',
        []
      );

      orderHistory.push(receipt);

      localStorage.setItem(
        'orderHistory',
        JSON.stringify(orderHistory)
      );
    }

    this.showReceipt.set(false);
    this.orderReceipt.set(null);
    this.directCheckoutItem.set(null);
  }

  // Close checkout modal
  closeCheckout(): void {
    this.showCheckout.set(false);
    this.directCheckoutItem.set(null);
  }

  // Close receipt modal
  closeReceipt(): void {
    this.showReceipt.set(false);
    this.directCheckoutItem.set(null);
  }

  // Request book acquisition
  requestAcquisition(): void {
    this.appDialog.show(
      'Coming Soon',
      'Book acquisition requests will be available in a future update.'
    );
  }
}
