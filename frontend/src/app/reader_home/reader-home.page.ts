
import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService, authErrorMessage } from '../services/auth_service';
import { BorrowingService } from '../services/borrowing.service';
import { finalize } from 'rxjs';
import { PageHeaderActions } from '../services/page-header-actions';
import { ShopService } from '../services/shop.service';
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
  private borrowing = inject(BorrowingService);
  private shop = inject(ShopService);
  readonly wishlistBusy = signal(false);
  readonly cartBusy = signal(false);
  private route = inject(ActivatedRoute);
  private appDialog = inject(AppDialogService);
  readonly pageHeaderActions = inject(PageHeaderActions);
  readonly readerName = computed(() => this.authService.currentUser()?.fullName || 'Reader');

  readonly catalog = inject(BookCatalogService);
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
  readonly sendingRequest = signal(false);
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

  ionViewWillEnter(): void {
    this.catalog.refresh();
    this.shop.refresh();
  }

  toggleWishlist(book: Book): void {
    if (this.wishlistBusy()) return;
    this.wishlistBusy.set(true);
    this.shop.setWishlisted(book.id, !this.isWishlisted(book.id)).pipe(
      finalize(() => this.wishlistBusy.set(false)),
    ).subscribe({
      error: error => this.appDialog.show('Unable to update wishlist', authErrorMessage(error, 'Please try again.'), 'warning'),
    });
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
    if (this.cartBusy()) return;
    this.cartBusy.set(true);
    this.shop.changeCart(book.id, 1).pipe(finalize(() => this.cartBusy.set(false))).subscribe({
      next: () => {
        this.closeBookDetails();
        this.appDialog.show('Added to Shopping Cart', `"${book.title}" has been added to your shopping cart.`, 'success');
      },
      error: error => this.appDialog.show('Unable to update cart', authErrorMessage(error, 'Please try again.'), 'warning'),
    });
  }

  borrowBook(id: number): void {
    if (this.sendingRequest()) return;
    this.sendingRequest.set(true);
    this.borrowing.requestBook(id).pipe(finalize(() => this.sendingRequest.set(false))).subscribe({
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

  requestBook(): void {
    this.requestOpen.set(true);
  }

  submitRequest(): void {
    const title = this.requestedTitle.trim();
    const author = this.requestedAuthor.trim();
    if (!title || !author) {
      this.appDialog.show('Book Details Needed', 'Please enter both the book title and author.', 'warning');
      return;
    }
    if (this.sendingRequest()) return;

    this.sendingRequest.set(true);
    this.borrowing.requestAcquisition(title, author).pipe(finalize(() => this.sendingRequest.set(false))).subscribe({
      next: () => {
        this.requestedTitle = '';
        this.requestedAuthor = '';
        this.requestOpen.set(false);
        this.appDialog.show('Request Submitted', 'Your acquisition request has been submitted.', 'success');
      },
      error: error => this.appDialog.show('Unable to submit request', authErrorMessage(error, 'Please try again.'), 'warning'),
    });
  }
}
