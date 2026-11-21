
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
  IonCardContent,
  IonBadge,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonModal,
  IonInput
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
  refreshOutline,
  trashOutline,
  archiveOutline,
  informationCircleOutline
} from 'ionicons/icons';

interface Book {
  id: number;
  title: string;
  author: string;
  copies: number;
  status: string;
  lastUpdated: string;
}

interface BorrowRequest {
  id: number;
  bookTitle: string;
  reader: string;
  status: string;
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
    IonCardContent,
    IonBadge,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonModal,
    IonInput
  ]
})

export class AdminHomePage {

  // Dependency Injection
  private router = inject(Router);

  // Sample Book Data
  books = signal<Book[]>([
    {
      id: 1,
      title: 'The Rain in España',
      author: 'Gwy Saludes',
      copies: 12,
      status: 'Active',
      lastUpdated: 'Oct 25, 2026'
    }
  ]);

  // Sample Borrow Requests
  requests = signal<BorrowRequest[]>([]);

  // User Logs
  logs = signal<string[]>([
    'Admin logged into the system.',
    'Book catalog opened.',
    'Dashboard viewed.'
  ]);

  // Component Properties
  formTitle = '';
  formAuthor = '';
  formCopies: number = 1;

  // Angular Signals
  isModalOpen = signal(false);
  isEditing = signal(false);

  detailsOpen = signal(false);
  requestsOpen = signal(false);
  logsOpen = signal(false);

  filterStatus = signal('Active');

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

    if (filter === 'All') {
      return this.books();
    }

    return this.books().filter(book =>
      book.status === filter
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
      refreshOutline,
      trashOutline,
      archiveOutline,
      informationCircleOutline
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

      alert('Please complete all book information.');
      return;

    }

    const copies = parseInt(String(this.formCopies), 10);

    if (!Number.isFinite(copies) || copies < 1) {

      alert('Please enter at least one copy.');
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
                lastUpdated: this.getCurrentDate()
              }
            : book

        )

      );

      this.addLog('Updated book: ' + this.formTitle);

      alert('Book updated successfully!');

    } else {

      // CREATE BOOK
      const newBook: Book = {

        id: Date.now(),
        title: this.formTitle.trim(),
        author: this.formAuthor.trim(),
        copies: copies,
        status: 'Active',
        lastUpdated: this.getCurrentDate()

      };

      this.books.update(bookList => [
        ...bookList,
        newBook
      ]);

      this.addLog('Added book: ' + newBook.title);

      alert('Book added successfully!');

    }

    this.closeModal();

  }

  // Delete Book
  deleteBook(id: number) {

    const book = this.books().find(item => item.id === id);

    if (!book) {
      return;
    }

    const confirmed = confirm(
      'Are you sure you want to delete ' + book.title + '?'
    );

    if (confirmed) {

      this.books.update(bookList =>
        bookList.filter(item => item.id !== id)
      );

      this.addLog('Deleted book: ' + book.title);

    }

  }

  // Renew Book
  renewBook(id: number) {

    this.books.update(bookList =>

      bookList.map(book =>

        book.id === id
          ? {
              ...book,
              status: 'Active',
              lastUpdated: this.getCurrentDate()
            }
          : book

      )

    );

    this.addLog('Renewed book ID: ' + id);

    alert('Book renewed successfully!');

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

    alert(report);

    this.addLog('Generated library report.');

  }

  // Open User Logs
  openLogs() {

    this.logsOpen.set(true);

  }

  // Add User Log
  addLog(message: string) {

    this.logs.update(oldLogs => [
      new Date().toLocaleString() + ' - ' + message,
      ...oldLogs
    ]);

  }

  // Get Current Date
  getCurrentDate(): string {

    return new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    });

  }

  // Logout
  logout() {

    localStorage.removeItem('userData');

    this.router.navigateByUrl('/login');

  }

}
