
import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppDialogService } from '../services/app-dialog.service';
import { BookCatalogService, CatalogBook } from '../services/book-catalog.service';

import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonCard,
  IonBadge,
  IonModal,
  IonSearchbar,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption
} from '@ionic/angular';

import { addIcons } from 'ionicons';

import {
  logOutOutline,
  add,
  timeOutline,
  documentTextOutline,
  listOutline,
  bookOutline,
  createOutline,
  archiveOutline,
  refreshOutline,
  trashOutline,
  informationCircleOutline,
  closeOutline,
  bagOutline,
  chevronForwardOutline,
  chevronDownOutline,
  layersOutline,
  sparklesOutline,
  heartOutline,
  skullOutline,
  planetOutline,
  happyOutline,
  flameOutline,
  checkmarkCircle
} from 'ionicons/icons';

type Book = CatalogBook;

interface BorrowRequest {
  id: number;
  bookTitle: string;
  reader: string;
  status: string;
  requestedAt?: string;
  author?: string;
}

interface PurchaseItem {
  title: string;
  author: string;
  price: number;
  quantity: number;
}

interface PurchaseOrder {
  orderId: string;
  date: string;
  items: PurchaseItem[];
}

@Component({
  selector: 'app-admin-home',
  templateUrl: './admin-home.page.html',
  styleUrls: ['./admin-home.page.scss'],
  standalone: true,
  imports: [
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonCard,
    IonBadge,
    IonModal,
    IonSearchbar,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption
  ]
})

export class AdminHomePage {

  // Dependency Injection
  private router = inject(Router);
  private appDialog = inject(AppDialogService);
  private catalog = inject(BookCatalogService);

  // Shared catalog used by reader and shop pages.
  readonly books = this.catalog.books;

  // Sample Borrow Requests
  requests = signal<BorrowRequest[]>(
    this.loadData<BorrowRequest[]>('borrowRequests', []).map(request => ({
      ...request,
      status: request.status === 'Rejected' ? 'Declined' : request.status
    }))
  );
  purchasedOrders = signal<PurchaseOrder[]>(this.loadData<PurchaseOrder[]>('orderHistory', []));
  purchasedItems = computed(() => this.purchasedOrders().flatMap(order =>
    (order.items || []).map(item => ({ ...item, orderId: order.orderId, date: order.date }))
  ));

  // User Logs
  logs = signal<string[]>(this.loadData<string[]>('adminLogs', [
    'Admin logged into the system.',
    'Book catalog opened.',
    'Dashboard viewed.'
  ]));

  private loadData<T>(key: string, fallback: T): T {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) as T : fallback;
    } catch {
      return fallback;
    }
  }

  private persist<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  // Component Properties
  formTitle = '';
  formAuthor = '';
  formCopies: number = 1;
  formGenre = 'Romance';
  formPrice = 350;
  formRating = 0;
  formReviews = 0;
  formSynopsis = '';

  // Angular Signals
  isModalOpen = signal(false);
  isEditing = signal(false);

  detailsOpen = signal(false);
  requestsOpen = signal(false);
  logsOpen = signal(false);
  purchasedBooksOpen = signal(false);
  activeAdminAction = signal<'add' | 'requests' | 'report' | 'logs' | 'archived' | 'purchased' | null>(null);

  filterStatus = signal('Active');
  filterGenre = signal('');
  bookSearchQuery = signal('');
  genreFilterOpen = signal(false);
  readonly bookGenreOptions = [
    { name: 'Romance', icon: 'heart-outline' },
    { name: 'Horror', icon: 'skull-outline' },
    { name: 'Sci-fi', icon: 'planet-outline' },
    { name: 'Comedy', icon: 'happy-outline' },
    { name: 'Mythology', icon: 'flame-outline' }
  ];
  readonly bookGenres = this.bookGenreOptions.map(option => option.name);
  activeBookCount = computed(() => this.books().filter(book => book.status === 'Active').length);

  selectedBook = signal<Book | null>(null);
  editingId = signal<number | null>(null);

  // Computed Statistics
  activeCopies = computed(() => {

    return this.books()
      .filter(book => book.status === 'Active')
      .reduce((total, book) => total + book.copies, 0);

  });

  pendingRequests = computed(() => {

    return this.requests()
      .filter(request => request.status === 'Pending').length;

  });

  // Filter Books
  filteredBooks = computed(() => {

    const filter = this.filterStatus();
    const genre = this.filterGenre();
    const query = this.bookSearchQuery().trim().toLocaleLowerCase();

    return this.books().filter(book =>
      (filter === 'All' || book.status === filter) &&
      (!genre || book.genre === genre) &&
      (!query || [book.title, book.author, book.genre, book.synopsis]
        .some(value => value.toLocaleLowerCase().includes(query)))
    );

  });

  constructor() {

    // Register Ionic Icons
    addIcons({
      logOutOutline,
      add,
      timeOutline,
      documentTextOutline,
      listOutline,
      bookOutline,
      createOutline,
      archiveOutline,
      refreshOutline,
      trashOutline,
      informationCircleOutline,
      closeOutline,
      bagOutline,
      chevronForwardOutline,
      chevronDownOutline,
      layersOutline,
      sparklesOutline,
      heartOutline,
      skullOutline,
      planetOutline,
      happyOutline,
      flameOutline,
      checkmarkCircle
    });

  }

  // Open Add Book Modal
  openAddBook() {

    this.activeAdminAction.set('add');
    this.clearForm();

    this.isEditing.set(false);
    this.isModalOpen.set(true);

  }

  // Open Edit Book Modal
  editBook(book: Book) {

    this.formTitle = book.title;
    this.formAuthor = book.author;
    this.formCopies = book.copies;
    this.formGenre = book.genre || 'Romance';
    this.formPrice = book.price ?? 350;
    this.formRating = book.rating ?? 0;
    this.formReviews = book.reviews ?? 0;
    this.formSynopsis = book.synopsis ?? '';

    this.editingId.set(book.id);

    this.isEditing.set(true);
    this.isModalOpen.set(true);

  }

  // Save or Update Book
  saveBook() {

    if (
      this.formTitle.trim() === '' ||
      this.formAuthor.trim() === ''
    ) {

      this.showDialog('Missing information', 'Please complete all book information.');
      return;

    }

    const copies = parseInt(String(this.formCopies), 10);
    const price = Number(this.formPrice);
    const rating = parseFloat(String(this.formRating));
    const reviews = parseInt(String(this.formReviews), 10);

    if (!Number.isFinite(copies) || copies < 1) {

      this.showDialog('Invalid copies', 'Please enter at least one copy.');
      return;

    }

    if (!Number.isFinite(price) || price < 0) {
      this.showDialog('Invalid price', 'Enter a valid price of zero or more.');
      return;
    }

    if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
      this.showDialog('Invalid rating', 'Enter a rating from 0 to 5.');
      return;
    }

    if (!Number.isFinite(reviews) || reviews < 0) {
      this.showDialog('Invalid review count', 'Enter zero or more reviews.');
      return;
    }

    let successTitle: string;
    let successMessage: string;

    if (this.isEditing()) {

      // UPDATE BOOK
      this.books.update(bookList =>

        bookList.map(book =>

          book.id === this.editingId()
            ? {
                ...book,
                title: this.formTitle.trim(),
                author: this.formAuthor.trim(),
                copies: copies,
                genre: this.formGenre,
                price,
                rating,
                reviews,
                synopsis: this.formSynopsis.trim(),
                lastUpdated: this.getCurrentDate()
              }
            : book

        )

      );
      this.catalog.save();

      this.addLog('Updated book: ' + this.formTitle);

      successTitle = 'Book Updated';
      successMessage = `“${this.formTitle.trim()}” has been updated in the catalog.`;

    } else {

      // CREATE BOOK
      const newBook: Book = {

        id: Date.now(),
        title: this.formTitle.trim(),
        author: this.formAuthor.trim(),
        copies: copies,
        genre: this.formGenre,
        price,
        status: 'Active',
        lastUpdated: this.getCurrentDate(),
        rating,
        reviews,
        synopsis: this.formSynopsis.trim()

      };

      this.books.update(bookList => [
        ...bookList,
        newBook
      ]);
      this.catalog.save();

      this.addLog('Added book: ' + newBook.title);

      successTitle = 'Book Added';
      successMessage = `“${newBook.title}” has been added to the catalog.`;

    }

    this.closeModal();
    this.appDialog.show(successTitle, successMessage, 'success');

  }

  // Delete Book
  deleteBook(id: number) {

    const book = this.books().find(item => item.id === id);

    if (!book) {
      return;
    }

    this.activeAdminAction.set(null);
    this.appDialog.showConfirmation(
      'Delete this book permanently?',
      `Are you sure you want to permanently delete “${book.title}”? This action cannot be undone.`,
      () => this.confirmPermanentDelete(id),
      'Delete Permanently',
      'danger'
    );

  }

  // Archive Book
  archiveBook(id: number) {

    this.books.update(bookList =>

      bookList.map(book =>

        book.id === id
          ? {
              ...book,
              status: 'Archived',
              lastUpdated: this.getCurrentDate()
            }
          : book

      )

    );
    this.catalog.save();

    this.addLog('Archived book ID: ' + id);

  }

  restoreBook(id: number): void {
    this.books.update(bookList => bookList.map(book =>
      book.id === id
        ? { ...book, status: 'Active', lastUpdated: this.getCurrentDate() }
        : book
    ));
    this.catalog.save();
    this.addLog('Restored book ID: ' + id);
  }

  // View Book Details
  viewDetails(book: Book) {

    this.selectedBook.set(book);
    this.detailsOpen.set(true);

  }

  // Close Add/Edit Modal
  closeModal() {

    this.isModalOpen.set(false);
    if (this.activeAdminAction() === 'add') this.activeAdminAction.set(null);
    this.clearForm();

  }

  // Clear Form
  clearForm() {

    this.formTitle = '';
    this.formAuthor = '';
    this.formCopies = 1;
    this.formGenre = 'Romance';
    this.formPrice = 350;
    this.formRating = 0;
    this.formReviews = 0;
    this.formSynopsis = '';

    this.editingId.set(null);

  }

  // Open Borrow Requests
  openRequests() {

    this.activeAdminAction.set('requests');
    this.requestsOpen.set(true);

  }

  closeRequests(): void {
    this.requestsOpen.set(false);
    if (this.activeAdminAction() === 'requests') this.activeAdminAction.set(null);
  }

  // Approve or Reject Request
  updateRequest(id: number, status: string) {

    this.requests.update(requestList =>

      requestList.map(request =>

        request.id === id
          ? { ...request, status: status }
          : request

      )

    );
    this.persist('borrowRequests', this.requests());

    this.addLog('Request ' + id + ' was ' + status);

  }

  // Generate Report
  generateReport() {
    this.activeAdminAction.set(null);
    const availableBooks = this.books().filter(book =>
      book.status === 'Active' && book.copies > 0
    );
    const rows = [
      ['Book Title', 'Available Copies'],
      ...availableBooks.map(book => [book.title, String(book.copies)])
    ];
    const csv = '\uFEFF' + rows.map(row => row.map(value => {
      const safeValue = /^[=+\-@]/.test(value) ? `'${value}` : value;
      return `"${safeValue.replace(/"/g, '""')}"`;
    }).join(',')).join('\r\n');
    const file = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const fileUrl = URL.createObjectURL(file);
    const downloadLink = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    downloadLink.href = fileUrl;
    downloadLink.download = `available-books-${date}.csv`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    window.setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);

    this.addLog('Downloaded available books report.');
  }

  // Open User Logs
  openLogs() {

    this.activeAdminAction.set('logs');
    this.logsOpen.set(true);

  }

  closeLogs(): void {
    this.logsOpen.set(false);
    if (this.activeAdminAction() === 'logs') this.activeAdminAction.set(null);
  }

  openPurchasedBooks(): void {
    this.activeAdminAction.set('purchased');
    this.purchasedOrders.set(this.loadData<PurchaseOrder[]>('orderHistory', []));
    this.purchasedBooksOpen.set(true);
  }

  closePurchasedBooks(): void {
    this.purchasedBooksOpen.set(false);
    if (this.activeAdminAction() === 'purchased') this.activeAdminAction.set(null);
  }

  showArchivedBooks(): void {
    this.activeAdminAction.set('archived');
    this.filterGenre.set('');
    this.filterStatus.set('Archived');
  }

  showActiveBooks(): void {
    this.activeAdminAction.set(null);
    this.filterGenre.set('');
    this.filterStatus.set('Active');
  }

  openGenreFilter(): void {
    this.genreFilterOpen.set(true);
  }

  selectBookGenre(genre: string): void {
    this.filterGenre.set(genre);
    this.filterStatus.set('Active');
    this.genreFilterOpen.set(false);
  }

  searchBooks(value: string | null | undefined): void {
    this.bookSearchQuery.set(value ?? '');
  }

  genreBookCount(genre: string): number {
    return this.books().filter(book => book.status === 'Active' && book.genre === genre).length;
  }

  private showDialog(title: string, message: string): void {
    this.appDialog.show(title, message, 'warning');
  }

  private confirmPermanentDelete(id: number): void {
    const book = this.books().find(item => item.id === id);
    if (!book) return;

    this.books.update(bookList => bookList.filter(item => item.id !== id));
    this.catalog.save();
    this.addLog('Deleted book: ' + book.title);
  }

  // Add User Log
  addLog(message: string) {

    this.logs.update(oldLogs => [
      new Date().toLocaleString() + ' - ' + message,
      ...oldLogs
    ]);
    this.persist('adminLogs', this.logs());

  }

  // Get Current Date
  getCurrentDate(): string {

    return new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    });

  }

  openLogoutConfirmation(): void {
    this.appDialog.showConfirmation(
      'Are you sure you want to log out?',
      '',
      () => this.confirmLogout(),
      'Log Out'
    );
  }

  confirmLogout(): void {
    localStorage.removeItem('userData');
    this.router.navigateByUrl('/login');
  }

}
