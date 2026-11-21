
import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../services/auth_service';
import { PageHeaderActions } from '../services/page-header-actions';
import type { WishlistItem } from '../services/page-header-actions';
import { AppDialogService } from '../services/app-dialog.service';
import { BookCatalogService } from '../services/book-catalog.service';

import {
  IonContent,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonSearchbar,
  IonModal,
  IonHeader,
  IonInput
} from '@ionic/angular';

import { addIcons } from 'ionicons';
import {
  bookOutline, heart, heartOutline
} from 'ionicons/icons';

interface Book {
  id: number;
  title: string;
  author: string;
  description: string;
  coverClass: string;
  genre: string;
  price: number;
  rating: number;
  reviews: number;
  availableCopies: number;
}

@Component({
  selector: 'app-reader-home',
  templateUrl: './reader-home.page.html',
  styleUrls: ['./reader-home.page.scss'],
  standalone: true,
  imports: [
    FormsModule,
    IonContent, IonToolbar, IonTitle,
    IonButtons, IonButton, IonIcon,
    IonCard, IonCardHeader, IonCardTitle,
    IonCardSubtitle, IonCardContent,
    IonSearchbar,
    IonModal, IonHeader, IonInput
  ]
})

export class ReaderHomePage {

  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private appDialog = inject(AppDialogService);
  readonly pageHeaderActions = inject(PageHeaderActions);
  readonly username = this.authService.getUserData()?.user?.username
    || this.authService.getUserData()?.username
    || 'Reader';

  private catalog = inject(BookCatalogService);
  readonly books = computed<Book[]>(() => this.catalog.books()
    .filter(book => book.status === 'Active')
    .map(book => ({
      id: book.id,
      title: book.title,
      author: book.author,
      description: book.synopsis,
      coverClass: book.genre === 'Horror' || book.genre === 'Sci-fi' ? 'cover-blue' : book.genre === 'Romance' ? 'cover-orange' : 'cover-green',
      genre: book.genre,
      price: book.price,
      rating: book.rating,
      reviews: book.reviews,
      availableCopies: book.copies
    })));
  // Component Properties
  searchText = signal('');
  requestedTitle = '';
  requestedAuthor = '';

  // Signals
  requestOpen = signal(false);
  selectedGenre = signal('');
  detailsOpen = signal(false);
  selectedBook = signal<Book | null>(null);

  booksForSelectedGenre = computed(() => {
    const genre = this.selectedGenre();
    return this.books().filter(book => !genre || book.genre === genre);
  });

  reservedGridHeight = computed(() => {
    const rows = Math.ceil(this.books().length / 2);
    return rows * 320 + Math.max(0, rows - 1) * 12;
  });

  // Computed Values
  filteredBooks = computed(() => {
    const search = this.searchText().toLowerCase().trim();

    return this.booksForSelectedGenre().filter(book =>
      !search || book.title.toLowerCase().includes(search) ||
        book.author.toLowerCase().includes(search)
    );
  });

  constructor() {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed())
      .subscribe(params => this.selectedGenre.set(params.get('genre') ?? ''));

    addIcons({
      bookOutline, heart, heartOutline
    });
  }

  isWishlisted(bookId: number): boolean {
    return this.pageHeaderActions.wishlist().some(item => item.id === bookId);
  }

  toggleWishlist(book: Book): void {
    if (this.isWishlisted(book.id)) {
      this.pageHeaderActions.removeWishlist(book.id);
      return;
    }

    const item: WishlistItem = { id: book.id, title: book.title, price: book.price };
    this.pageHeaderActions.wishlist.update(items => [...items, item]);
    this.pageHeaderActions.saveWishlist();
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

  addToCart(book: Book): void {
    let cart: Array<{
      id: number;
      title: string;
      author: string;
      price: number;
      quantity: number;
      selected: boolean;
    }> = [];

    try {
      cart = JSON.parse(localStorage.getItem('cart') || '[]');
    } catch {
      cart = [];
    }

    const existingItem = cart.find(item => item.id === book.id);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        id: book.id,
        title: book.title,
        author: book.author,
        price: book.price,
        quantity: 1,
        selected: true
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    this.pageHeaderActions.shopCartCount.set(
      cart.reduce((count, item) => count + item.quantity, 0)
    );
    this.closeBookDetails();
    this.appDialog.show(
      'Added to Shopping Cart',
      `"${book.title}" has been added to your shopping cart.`,
      'success'
    );
  }

  borrowBook(id: number) {
    const book = this.books().find(item => item.id === id);

    if (book) {
      const requests = this.loadRequests();
      if (requests.some((request: any) => request.bookTitle === book.title && request.reader === this.username && request.status === 'Pending')) {
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
        synopsis: book.description,
        reader: this.username,
        status: 'Pending',
        requestedAt: new Date().toLocaleString()
      });
      localStorage.setItem('borrowRequests', JSON.stringify(requests));
      this.closeBookDetails();
      this.appDialog.show(
        'Request Submitted',
        'Your request to borrow “' + book.title + '” has been submitted.',
        'success'
      );
    }
  }

  private loadRequests(): any[] {
    try {
      return JSON.parse(localStorage.getItem('borrowRequests') || '[]');
    } catch {
      return [];
    }
  }

  requestBook() {
    this.requestOpen.set(true);
  }

  submitRequest() {
    if (
      this.requestedTitle.trim() === '' ||
      this.requestedAuthor.trim() === ''
    ) {
      this.appDialog.show(
        'Book Details Needed',
        'Please enter both the book title and author.',
        'warning'
      );
      return;
    }

    const requests = this.loadRequests();
    requests.unshift({
      id: Date.now(),
      bookTitle: this.requestedTitle.trim(),
      reader: this.username,
      status: 'Pending',
      requestedAt: new Date().toLocaleString(),
      author: this.requestedAuthor.trim()
    });
    localStorage.setItem('borrowRequests', JSON.stringify(requests));
    this.appDialog.show(
      'Request Submitted',
      'Your book request has been submitted.',
      'success'
    );

    this.requestedTitle = '';
    this.requestedAuthor = '';
    this.requestOpen.set(false);
  }

}
