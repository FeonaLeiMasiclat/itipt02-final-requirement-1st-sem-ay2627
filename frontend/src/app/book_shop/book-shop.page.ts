
import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PageHeaderActions, type WishlistItem } from '../services/page-header-actions';

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
  heart,
  heartOutline,
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
  checkmark
} from 'ionicons/icons';

interface Book {
  id: number;
  title: string;
  author: string;
  price: number;
  rating: number;
  reviews: number;
  genre: string;
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
  selectedGenre = signal('');

  // Search
  searchText = '';
  searchQuery = signal('');

  // Book list
  books = signal<Book[]>([
    {
      id: 1,
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      price: 350,
      rating: 4.8,
      reviews: 120,
      genre: 'Romance'
    },
    {
      id: 2,
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      price: 420,
      rating: 4.9,
      reviews: 150,
      genre: 'Romance'
    },
    {
      id: 3,
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      price: 300,
      rating: 4.7,
      reviews: 95,
      genre: 'Romance'
    },
    {
      id: 4,
      title: 'The Hobbit',
      author: 'J.R.R. Tolkien',
      price: 450,
      rating: 4.9,
      reviews: 180,
      genre: 'Mythology'
    },
    {
      id: 5,
      title: 'The Alchemist',
      author: 'Paulo Coelho',
      price: 380,
      rating: 4.6,
      reviews: 110,
      genre: 'Mythology'
    },
    {
      id: 6,
      title: 'Little Women',
      author: 'Louisa May Alcott',
      price: 320,
      rating: 4.8,
      reviews: 88,
      genre: 'Romance'
    },
    {
      id: 7,
      title: '1984',
      author: 'George Orwell',
      price: 390,
      rating: 4.7,
      reviews: 130,
      genre: 'Sci-fi'
    },
    {
      id: 8,
      title: 'The Catcher in the Rye',
      author: 'J.D. Salinger',
      price: 360,
      rating: 4.5,
      reviews: 76,
      genre: 'Comedy'
    }
  ]);

  // Filtered books
  filteredBooks = computed(() => {
    const search = this.searchQuery().toLowerCase().trim();
    const genre = this.selectedGenre();

    return this.books().filter(book =>
      (!search || book.title.toLowerCase().includes(search) ||
        book.author.toLowerCase().includes(search)) &&
      (!genre || book.genre === genre)
    );
  });

  // Wishlist and cart
  readonly wishlist = this.pageHeaderActions.wishlist;

  cart = signal<CartItem[]>(
    this.loadData<CartItem[]>('cart', [])
  );

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
      heart,
      heartOutline,
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
      checkmark
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

  // Save wishlist
  saveWishlist(): void {
    this.pageHeaderActions.saveWishlist();
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

  // Check if a book is already in wishlist
  isWishlisted(bookId: number): boolean {
    return this.wishlist().some(item => item.id === bookId);
  }

  // Add or remove a book from wishlist
  toggleWishlist(book: Book): void {
    if (this.isWishlisted(book.id)) {
      this.removeWishlist(book.id);
    } else {
      const newItem: WishlistItem = {
        id: book.id,
        title: book.title,
        price: book.price
      };

      this.wishlist.update(items => [...items, newItem]);
      this.saveWishlist();
    }
  }

  // Remove book from wishlist
  removeWishlist(bookId: number): void {
    this.pageHeaderActions.removeWishlist(bookId);
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

  // Buy now
  buyNow(book: Book): void {
    this.addToCart(book);
    this.showCart.set(true);
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

  // Close wishlist and cart drawers
  closeDrawers(): void {
    this.showCart.set(false);
  }

  // Open checkout modal
  proceedToCheckout(): void {
    if (this.selectedItems() === 0) {
      alert('Please select at least one book before checkout.');
      return;
    }

    this.showCart.set(false);
    this.showCheckout.set(true);
  }

  // Confirm order and create receipt
  confirmOrder(): void {
    const itemsToPurchase = this.checkoutItems();

    if (itemsToPurchase.length === 0) {
      alert('Your checkout list is empty.');
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

    if (receipt) {
      const purchasedIds = receipt.items.map(item => item.id);

      // Remove purchased books from cart
      this.cart.update(items =>
        items.filter(item => !purchasedIds.includes(item.id))
      );

      this.saveCart();

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
  }

  // Close checkout modal
  closeCheckout(): void {
    this.showCheckout.set(false);
  }

  // Close receipt modal
  closeReceipt(): void {
    this.showReceipt.set(false);
  }

  // Request book acquisition
  requestAcquisition(): void {
    alert('Book acquisition request feature will be connected soon.');
  }
}
