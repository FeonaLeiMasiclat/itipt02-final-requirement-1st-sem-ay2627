
import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonCard,
  IonBadge,
  IonModal,
  IonInput,
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
  informationCircleOutline,
  closeOutline,
  bagOutline,
  chevronForwardOutline
} from 'ionicons/icons';

interface Book {
  id: number;
  title: string;
  author: string;
  copies: number;
  status: string;
  lastUpdated: string;
  genre: string;
  price: number;
}

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
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonCard,
    IonBadge,
    IonModal,
    IonInput,
    IonSelect,
    IonSelectOption
  ]
})

export class AdminHomePage {

  // Dependency Injection
  private router = inject(Router);

  // Sample Book Data
  books = signal<Book[]>(this.loadData<Book[]>('adminBooks', [
    {
      id: 1,
      title: 'The Rain in España',
      author: 'Gwy Saludes',
      copies: 12,
      status: 'Active',
      lastUpdated: 'Oct 25, 2026',
      genre: 'Romance',
      price: 350
    }
  ]).map(book => ({ ...book, genre: book.genre || 'Romance', price: book.price ?? 350 })));

  // Sample Borrow Requests
  requests = signal<BorrowRequest[]>(this.loadData<BorrowRequest[]>('borrowRequests', []));
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

  // Angular Signals
  isModalOpen = signal(false);
  isEditing = signal(false);

  detailsOpen = signal(false);
  requestsOpen = signal(false);
  logsOpen = signal(false);
  purchasedBooksOpen = signal(false);
  logoutConfirmOpen = signal(false);
  dialogOpen = signal(false);
  dialogTitle = signal('');
  dialogMessage = signal('');
  dialogMode = signal<'message' | 'confirm' | 'report'>('message');
  pendingDeleteId = signal<number | null>(null);

  filterStatus = signal('Active');
  filterGenre = signal('');
  genreFilterOpen = signal(false);
  readonly bookGenres = ['Romance', 'Horror', 'Sci-fi', 'Comedy', 'Mythology'];

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

    return this.books().filter(book =>
      (filter === 'All' || book.status === filter) &&
      (!genre || book.genre === genre)
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
      informationCircleOutline,
      closeOutline,
      bagOutline,
      chevronForwardOutline
    });

  }

  // Open Add Book Modal
  openAddBook() {

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

    if (!Number.isFinite(copies) || copies < 1) {

      this.showDialog('Invalid copies', 'Please enter at least one copy.');
      return;

    }

    if (!Number.isFinite(price) || price < 0) {
      this.showDialog('Invalid price', 'Enter a valid price of zero or more.');
      return;
    }

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
                lastUpdated: this.getCurrentDate()
              }
            : book

        )

      );
      this.persist('adminBooks', this.books());

      this.addLog('Updated book: ' + this.formTitle);

      this.dialogTitle.set('Book updated');
      this.dialogMessage.set('The book information was updated successfully.');

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
        lastUpdated: this.getCurrentDate()

      };

      this.books.update(bookList => [
        ...bookList,
        newBook
      ]);
      this.persist('adminBooks', this.books());

      this.addLog('Added book: ' + newBook.title);

      this.dialogTitle.set('Book added');
      this.dialogMessage.set('The book was added to the catalog successfully.');

    }

    this.closeModal();
    this.dialogMode.set('message');
    this.dialogOpen.set(true);

  }

  // Delete Book
  deleteBook(id: number) {

    const book = this.books().find(item => item.id === id);

    if (!book) {
      return;
    }

    this.pendingDeleteId.set(id);
    this.dialogTitle.set('Delete book?');
    this.dialogMessage.set('Are you sure you want to delete ' + book.title + '?');
    this.dialogMode.set('confirm');
    this.dialogOpen.set(true);

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
    this.persist('adminBooks', this.books());

    this.addLog('Archived book ID: ' + id);

  }

  // View Book Details
  viewDetails(book: Book) {

    this.selectedBook.set(book);
    this.detailsOpen.set(true);

  }

  // Close Add/Edit Modal
  closeModal() {

    this.isModalOpen.set(false);
    this.clearForm();

  }

  // Clear Form
  clearForm() {

    this.formTitle = '';
    this.formAuthor = '';
    this.formCopies = 1;
    this.formGenre = 'Romance';
    this.formPrice = 350;

    this.editingId.set(null);

  }

  // Open Borrow Requests
  openRequests() {

    this.requestsOpen.set(true);

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

    const total = this.books().length;
    const copies = this.activeCopies();
    const pending = this.pendingRequests();

    const report =
      'LIBRARY REPORT\n\n' +
      'Total Book Titles: ' + total + '\n' +
      'Active Copies: ' + copies + '\n' +
      'Pending Requests: ' + pending;

    this.dialogTitle.set('Library Report');
    this.dialogMessage.set(report);
    this.dialogMode.set('report');
    this.dialogOpen.set(true);

    this.addLog('Generated library report.');

  }

  // Open User Logs
  openLogs() {

    this.logsOpen.set(true);

  }

  openPurchasedBooks(): void {
    this.purchasedOrders.set(this.loadData<PurchaseOrder[]>('orderHistory', []));
    this.purchasedBooksOpen.set(true);
  }

  showArchivedBooks(): void {
    this.filterGenre.set('');
    this.filterStatus.set('Archived');
    document.getElementById('book-management')?.scrollIntoView({ behavior: 'smooth' });
  }

  openGenreFilter(): void {
    this.genreFilterOpen.set(true);
  }

  selectBookGenre(genre: string): void {
    this.filterGenre.set(genre);
    this.filterStatus.set('Active');
    this.genreFilterOpen.set(false);
  }

  private showDialog(title: string, message: string): void {
    this.dialogTitle.set(title);
    this.dialogMessage.set(message);
    this.dialogMode.set('message');
    this.dialogOpen.set(true);
  }

  closeDialog(): void {
    this.dialogOpen.set(false);
    this.pendingDeleteId.set(null);
  }

  confirmDialogAction(): void {
    if (this.dialogMode() === 'confirm') {
      const id = this.pendingDeleteId();
      const book = this.books().find(item => item.id === id);
      if (id !== null && book) {
        this.books.update(bookList => bookList.filter(item => item.id !== id));
        this.persist('adminBooks', this.books());
        this.addLog('Deleted book: ' + book.title);
      }
    }
    this.closeDialog();
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
    this.logoutConfirmOpen.set(true);
  }

  closeLogoutConfirmation(): void {
    this.logoutConfirmOpen.set(false);
  }

  confirmLogout(): void {
    this.closeLogoutConfirmation();
    localStorage.removeItem('userData');
    this.router.navigateByUrl('/login');
  }

}
