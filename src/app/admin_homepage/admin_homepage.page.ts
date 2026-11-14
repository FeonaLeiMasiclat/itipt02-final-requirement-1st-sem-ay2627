import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import type { OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular';

import { loadBorrowRequests, saveBorrowRequests } from '../shared/borrow-requests';
import type { BorrowRequest, BorrowRequestStatus } from '../shared/borrow-requests';

type BookStatus = 'Active' | 'Archived';
type DashboardPanel = 'addBook' | 'borrowRequests' | 'userLogs' | 'details' | null;
type StatusFilter = 'All' | BookStatus;

interface AdminBook {
  id: number;
  title: string;
  author: string;
  copies: number;
  status: BookStatus;
  updatedAt: string;
}

interface BookDraft {
  title: string;
  author: string;
  copies: number;
}

const BOOKS_STORAGE_KEY = 'lmsAdminBooks';
const DEFAULT_BOOKS: AdminBook[] = [
  {
    id: 1,
    title: 'The Rain in España',
    author: 'Gwy Saludes',
    copies: 12,
    status: 'Active',
    updatedAt: '2026-10-25',
  },
];

function isAdminBook(value: unknown): value is AdminBook {
  if (typeof value !== 'object' || value === null) return false;
  const book = value as Record<string, unknown>;
  return (
    typeof book['id'] === 'number' &&
    typeof book['title'] === 'string' &&
    typeof book['author'] === 'string' &&
    typeof book['copies'] === 'number' &&
    (book['status'] === 'Active' || book['status'] === 'Archived') &&
    typeof book['updatedAt'] === 'string'
  );
}

function readBooks(): AdminBook[] {
  const savedBooks = localStorage.getItem(BOOKS_STORAGE_KEY);
  if (savedBooks === null) return DEFAULT_BOOKS.map((book) => ({ ...book }));

  const parsedBooks: unknown = JSON.parse(savedBooks);
  if (!Array.isArray(parsedBooks) || !parsedBooks.every(isAdminBook)) {
    throw new Error('Saved admin book data has an invalid format.');
  }
  return parsedBooks;
}

@Component({
  selector: 'app-admin-homepage',
  templateUrl: './admin_homepage.page.html',
  styleUrls: ['./admin_homepage.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, RouterLink],
})
export class AdminHomepagePage implements OnInit {
  private readonly router = inject(Router);

  books: AdminBook[] = [];
  borrowRequests: BorrowRequest[] = [];
  panel: DashboardPanel = null;
  statusFilter: StatusFilter = 'Active';
  selectedBook: AdminBook | null = null;
  editingBookId: number | null = null;
  draft: BookDraft = this.emptyDraft();
  formError = '';
  statusMessage = '';
  lastAdminLogin = '';

  ngOnInit(): void {
    this.books = readBooks();
    this.borrowRequests = loadBorrowRequests();
    this.lastAdminLogin = localStorage.getItem('lmsAdminLastLoginAt') || '';
  }

  get filteredBooks(): AdminBook[] {
    return this.statusFilter === 'All' ? this.books : this.books.filter((book) => book.status === this.statusFilter);
  }

  get activeCopies(): number {
    return this.books.filter((book) => book.status === 'Active').reduce((total, book) => total + book.copies, 0);
  }

  get pendingRequests(): BorrowRequest[] {
    return this.borrowRequests.filter((request) => request.status === 'Pending');
  }

  get latestRequestCount(): number {
    return this.pendingRequests.length;
  }

  openAddBook(): void {
    this.editingBookId = null;
    this.draft = this.emptyDraft();
    this.formError = '';
    this.panel = 'addBook';
  }

  editBook(book: AdminBook): void {
    this.editingBookId = book.id;
    this.draft = { title: book.title, author: book.author, copies: book.copies };
    this.formError = '';
    this.panel = 'addBook';
  }

  saveBook(): void {
    const title = this.draft.title.trim();
    const author = this.draft.author.trim();
    const copies = Number(this.draft.copies);
    if (!title || !author || !Number.isInteger(copies) || copies < 1) {
      this.formError = 'Enter a title, author, and a copy count of at least 1.';
      return;
    }

    const updatedAt = new Date().toISOString();
    if (this.editingBookId !== null) {
      this.books = this.books.map((book) =>
        book.id === this.editingBookId ? { ...book, title, author, copies, updatedAt } : book,
      );
      this.statusMessage = `${title} updated.`;
    } else {
      this.books = [...this.books, { id: Date.now(), title, author, copies, status: 'Active', updatedAt }];
      this.statusMessage = `${title} added to the catalog.`;
    }
    this.persistBooks();
    this.closePanel();
  }

  renewBook(book: AdminBook): void {
    this.updateBook({
      ...book,
      status: 'Active',
      updatedAt: new Date().toISOString(),
    });
    this.statusMessage = `${book.title} renewed and marked active.`;
  }

  archiveBook(book: AdminBook): void {
    this.updateBook({ ...book, status: 'Archived' });
    this.statusMessage = `${book.title} archived.`;
  }

  deleteBook(book: AdminBook): void {
    if (!window.confirm(`Delete "${book.title}" from the catalog?`)) return;
    this.books = this.books.filter((item) => item.id !== book.id);
    this.persistBooks();
    this.statusMessage = `${book.title} deleted.`;
  }

  showDetails(book: AdminBook): void {
    this.selectedBook = book;
    this.panel = 'details';
  }

  openPanel(panel: Exclude<DashboardPanel, 'addBook' | 'details' | null>): void {
    this.borrowRequests = loadBorrowRequests();
    this.panel = panel;
  }

  updateRequest(request: BorrowRequest, status: BorrowRequestStatus): void {
    this.borrowRequests = this.borrowRequests.map((item) => (item.id === request.id ? { ...item, status } : item));
    saveBorrowRequests(this.borrowRequests);
  }

  downloadReport(): void {
    const rows = [
      ['Title', 'Author', 'Copies', 'Status', 'Last Updated'],
      ...this.books.map((book) => [book.title, book.author, String(book.copies), book.status, book.updatedAt]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'library-inventory-report.csv';
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.statusMessage = 'Inventory report downloaded.';
  }

  closePanel(): void {
    this.panel = null;
    this.selectedBook = null;
    this.formError = '';
  }

  logout(): void {
    localStorage.removeItem('lmsUserRole');
    localStorage.removeItem('lmsDisplayName');
    void this.router.navigate(['/login']);
  }

  trackBook(_index: number, book: AdminBook): number {
    return book.id;
  }

  trackRequest(_index: number, request: BorrowRequest): string {
    return request.id;
  }

  private updateBook(updatedBook: AdminBook): void {
    this.books = this.books.map((book) => (book.id === updatedBook.id ? updatedBook : book));
    this.persistBooks();
  }

  private persistBooks(): void {
    localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(this.books));
  }

  private emptyDraft(): BookDraft {
    return { title: '', author: '', copies: 1 };
  }
}
