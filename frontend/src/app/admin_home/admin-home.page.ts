
import { Component, HostListener, signal, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppDialogService } from '../services/app-dialog.service';
import { AuthService, authErrorMessage } from '../services/auth_service';
import { BookCatalogService, BookDetails, BookStatus, CatalogBook } from '../services/book-catalog.service';
import { BorrowDecision, BorrowRequest, BorrowingService } from '../services/borrowing.service';
import { OrderCustomer, ShopOrder, ShopService } from '../services/shop.service';
import { finalize, Observable, Subscription, tap } from 'rxjs';

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
  personOutline,
  bookmarkOutline,
  pricetagOutline,
  starOutline,
  star,
  createOutline,
  archiveOutline,
  refreshOutline,
  trashOutline,
  informationCircleOutline,
  closeOutline,
  checkmarkCircleOutline,
  downloadOutline,
  checkmarkOutline,
  bagOutline,
  bagCheckOutline,
  chevronForwardOutline,
  chevronBackOutline,
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

const requestFilters = ['All', 'Pending', 'Approved', 'Return Pending', 'Returned', 'Declined'] as const;
type RequestStatusFilter = typeof requestFilters[number];
type AdminLogCategory = 'Books' | 'Requests' | 'Reports';
type AdminLogFilter = 'All' | AdminLogCategory;

interface AdminLogEntry {
  id: number;
  message: string;
  category: AdminLogCategory;
  dateKey: string;
  dateLabel: string;
  timeLabel: string;
  iconName: string;
  iconTone: 'book' | 'request' | 'report' | 'archive';
}

interface AdminLogGroup {
  dateKey: string;
  dateLabel: string;
  entries: AdminLogEntry[];
}

@Component({
  selector: 'app-admin-home',
  templateUrl: './admin-home.page.html',
  styleUrls: ['./admin-home.page.scss'],
  standalone: true,
  imports: [
    DatePipe,
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
  private authService = inject(AuthService);
  private appDialog = inject(AppDialogService);
  readonly catalog = inject(BookCatalogService);
  readonly borrowing = inject(BorrowingService);
  private readonly shop = inject(ShopService);

  // Shared catalog used by reader and shop pages.
  readonly books = this.catalog.books;

  readonly requests = this.borrowing.requests;
  readonly decidingRequest = signal(false);
  readonly requestActionError = signal('');
  readonly requestFilters = requestFilters;
  requestStatusFilter = signal<RequestStatusFilter>('All');
  requestCounts = computed(() => {
    const counts: Record<RequestStatusFilter, number> = {
      All: 0, Pending: 0, Approved: 0, 'Return Pending': 0, Returned: 0, Declined: 0,
    };
    for (const request of this.requests()) {
      counts.All++;
      counts[request.status]++;
    }
    return counts;
  });
  filteredRequests = computed(() => {
    const status = this.requestStatusFilter();
    return this.requests().filter(request => status === 'All' || request.status === status);
  });
  readonly purchasedOrders = signal<ShopOrder[]>([]);
  readonly orderCustomers = signal<OrderCustomer[]>([]);
  readonly selectedCustomer = signal<OrderCustomer | null>(null);
  readonly ordersLoading = signal(false);
  readonly ordersError = signal('');
  private ordersRequest?: Subscription;

  // User Logs
  logs = signal<string[]>(this.loadData<string[]>('adminLogs', [
    'Admin logged into the system.',
    'Book catalog opened.',
    'Dashboard viewed.'
  ]));
  logFilter = signal<AdminLogFilter>('All');
  logEntries = computed(() => this.logs().map((entry, index) => this.parseAdminLog(entry, index)));
  logCounts = computed(() => {
    const entries = this.logEntries();
    return {
      all: entries.length,
      books: entries.filter(entry => entry.category === 'Books').length,
      requests: entries.filter(entry => entry.category === 'Requests').length,
      reports: entries.filter(entry => entry.category === 'Reports').length
    };
  });
  filteredLogEntries = computed(() => {
    const filter = this.logFilter();
    return this.logEntries().filter(entry => filter === 'All' || entry.category === filter);
  });
  logGroups = computed(() => {
    const groups: AdminLogGroup[] = [];
    for (const entry of this.filteredLogEntries()) {
      let group = groups.find(item => item.dateKey === entry.dateKey);
      if (!group) {
        group = { dateKey: entry.dateKey, dateLabel: entry.dateLabel, entries: [] };
        groups.push(group);
      }
      group.entries.push(entry);
    }
    return groups;
  });

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
  private startingCopies: number | null = null;
  formGenre = 'Romance';
  formPrice = 350;
  formRating = 0;
  formReviews = 0;
  formSynopsis = '';

  // Angular Signals
  isModalOpen = signal(false);
  isEditing = signal(false);
  readonly savingBook = signal(false);
  readonly changingBook = signal(false);

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
      personOutline,
      bookmarkOutline,
      pricetagOutline,
      starOutline,
      star,
      createOutline,
      archiveOutline,
      refreshOutline,
      trashOutline,
      informationCircleOutline,
      closeOutline,
      checkmarkCircleOutline,
      downloadOutline,
      checkmarkOutline,
      bagOutline,
      bagCheckOutline,
      chevronForwardOutline,
      chevronBackOutline,
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

  ionViewWillEnter(): void {
    this.catalog.refresh();
    this.borrowing.refresh();
  }

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
    this.startingCopies = book.copies;
    this.formGenre = book.genre || 'Romance';
    this.formPrice = book.price ?? 350;
    this.formRating = book.rating ?? 0;
    this.formReviews = book.reviews ?? 0;
    this.formSynopsis = book.synopsis ?? '';

    this.editingId.set(book.id);

    this.isEditing.set(true);
    this.isModalOpen.set(true);

  }

  saveBook(): void {
    if (this.savingBook()) return;

    const details: BookDetails = {
      title: this.formTitle.trim(),
      author: this.formAuthor.trim(),
      copies: Number(this.formCopies),
      genre: this.formGenre,
      price: Number(this.formPrice),
      rating: Number(this.formRating),
      reviews: Number(this.formReviews),
      synopsis: this.formSynopsis.trim(),
    };

    if (!details.title || !details.author) {
      this.showDialog('Missing information', 'Please enter the book title and author.');
      return;
    }
    if (!String(this.formCopies ?? '').trim() || !Number.isInteger(details.copies) || details.copies < 0) {
      this.showDialog('Invalid copies', 'Enter zero or more whole copies.');
      return;
    }
    if (!Number.isFinite(details.price) || details.price < 0) {
      this.showDialog('Invalid price', 'Enter a valid price of zero or more.');
      return;
    }
    if (!Number.isFinite(details.rating) || details.rating < 0 || details.rating > 5) {
      this.showDialog('Invalid rating', 'Enter a rating from 0 to 5.');
      return;
    }
    if (!Number.isInteger(details.reviews) || details.reviews < 0) {
      this.showDialog('Invalid review count', 'Enter zero or more whole reviews.');
      return;
    }

    const id = this.editingId();
    this.savingBook.set(true);
    this.catalog.save(details, id, this.startingCopies).pipe(finalize(() => this.savingBook.set(false))).subscribe({
      next: book => {
        const verb = id === null ? 'added' : 'updated';
        this.addLog((id === null ? 'Added book: ' : 'Updated book: ') + book.title);
        this.closeModal();
        this.appDialog.show(
          id === null ? 'Book Added' : 'Book Updated',
          `"${book.title}" has been ${verb} in the catalog.`,
          'success'
        );
      },
      error: error => this.showDialog('Unable to save book', authErrorMessage(error, 'Check the book information and try again.')),
    });
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

  archiveBook(id: number): void {
    this.updateBookStatus(id, 'Archived');
  }

  restoreBook(id: number): void {
    this.updateBookStatus(id, 'Active');
  }

  private updateBookStatus(id: number, status: BookStatus): void {
    if (this.changingBook()) return;
    this.changingBook.set(true);
    this.catalog.changeStatus(id, status).pipe(finalize(() => this.changingBook.set(false))).subscribe({
      next: book => this.addLog((status === 'Archived' ? 'Archived book: ' : 'Restored book: ') + book.title),
      error: error => this.showDialog('Unable to change book status', authErrorMessage(error, 'Please try again.')),
    });
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
    this.startingCopies = null;
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
    this.requestActionError.set('');
    this.requestsOpen.set(true);
    this.borrowing.refresh();

  }

  closeRequests(): void {
    this.requestsOpen.set(false);
    if (this.activeAdminAction() === 'requests') this.activeAdminAction.set(null);
  }

  updateRequest(id: number, status: BorrowDecision): void {
    this.runRequestAction(() => this.borrowing.decide(id, status));
  }

  confirmReturn(id: number): void {
    this.runRequestAction(() => this.borrowing.confirmReturn(id));
  }

  private runRequestAction(action: () => Observable<BorrowRequest>): void {
    if (this.decidingRequest()) return;
    this.requestActionError.set('');
    this.decidingRequest.set(true);
    action().pipe(finalize(() => this.decidingRequest.set(false))).subscribe({
      next: request => this.addLog('Request ' + request.id + ' was ' + request.status),
      error: error => {
        this.requestActionError.set(authErrorMessage(error, 'Unable to update the request. Please try again.'));
        this.borrowing.refresh();
        this.catalog.refresh();
      },
    });
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
    this.purchasedBooksOpen.set(true);
    this.selectedCustomer.set(null);
    this.loadOrders();
  }

  showCustomerOrders(customer: OrderCustomer): void {
    this.selectedCustomer.set(customer);
    this.purchasedOrders.set([]);
    this.loadOrders();
  }

  showOrderCustomers(): void {
    this.selectedCustomer.set(null);
    this.loadOrders();
  }

  @HostListener('window:focus')
  refreshOpenOrders(): void {
    if (this.purchasedBooksOpen()) this.loadOrders();
  }

  loadOrders(): void {
    this.ordersRequest?.unsubscribe();
    this.ordersLoading.set(true);
    this.ordersError.set('');
    const customer = this.selectedCustomer();
    const request: Observable<unknown> = customer
      ? this.shop.adminOrders(customer.id).pipe(tap(orders => this.purchasedOrders.set(orders)))
      : this.shop.orderCustomers().pipe(tap(customers => this.orderCustomers.set(customers)));
    this.ordersRequest = request.pipe(finalize(() => this.ordersLoading.set(false))).subscribe({
      error: error => this.ordersError.set(authErrorMessage(error, 'Unable to load pickup orders.')),
    });
  }

  closePurchasedBooks(): void {
    this.ordersRequest?.unsubscribe();
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
    if (!book || this.changingBook()) return;

    this.changingBook.set(true);
    this.catalog.remove(id).pipe(finalize(() => this.changingBook.set(false))).subscribe({
      next: () => this.addLog('Deleted book: ' + book.title),
      error: error => this.showDialog('Unable to delete book', authErrorMessage(error, 'Please try again.')),
    });
  }

  private parseAdminLog(log: string, id: number): AdminLogEntry {
    const separatorIndex = log.indexOf(' - ');
    const timestampText = separatorIndex >= 0 ? log.slice(0, separatorIndex) : '';
    const message = separatorIndex >= 0 ? log.slice(separatorIndex + 3) : log;
    const timestamp = new Date(timestampText);
    const hasTimestamp = timestampText.length > 0 && !Number.isNaN(timestamp.getTime());
    const normalizedMessage = message.toLocaleLowerCase();
    const category: AdminLogCategory = normalizedMessage.startsWith('request ')
      ? 'Requests'
      : normalizedMessage.includes('report')
        ? 'Reports'
        : 'Books';
    const iconName = category === 'Reports'
      ? 'download-outline'
      : category === 'Requests'
        ? normalizedMessage.includes('approv') ? 'checkmark-outline' : 'close-outline'
        : normalizedMessage.startsWith('added book:')
          ? 'add'
          : normalizedMessage.startsWith('archived book')
            ? 'archive-outline'
            : normalizedMessage.startsWith('restored book')
              ? 'refresh-outline'
              : normalizedMessage.startsWith('deleted book')
                ? 'trash-outline'
                : normalizedMessage.startsWith('updated book')
                  ? 'create-outline'
                  : 'book-outline';
    const dateKey = hasTimestamp
      ? `${timestamp.getFullYear()}-${timestamp.getMonth() + 1}-${timestamp.getDate()}`
      : 'undated';

    return {
      id,
      message,
      category,
      dateKey,
      dateLabel: hasTimestamp
        ? timestamp.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()
        : 'EARLIER ACTIVITY',
      timeLabel: hasTimestamp
        ? timestamp.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' })
        : '',
      iconName,
      iconTone: category === 'Reports'
        ? 'report'
        : category === 'Requests'
          ? 'request'
          : normalizedMessage.startsWith('archived book')
            ? 'archive'
            : 'book'
    };
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
  formatBookDate(value: string): string {
    return new Date(value + 'T00:00:00Z').toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: '2-digit', timeZone: 'UTC',
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
    this.authService.logout();
    void this.router.navigateByUrl('/login', { replaceUrl: true });
  }

}
