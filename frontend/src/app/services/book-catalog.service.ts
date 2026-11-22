import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent, tap } from 'rxjs';

import { AuthService, authErrorMessage } from './auth_service';

export type BookStatus = 'Active' | 'Archived';

export interface BookDetails {
  title: string;
  author: string;
  copies: number;
  genre: string;
  price: number;
  rating: number;
  reviews: number;
  synopsis: string;
}

export interface CatalogBook extends BookDetails {
  id: number;
  status: BookStatus;
  lastUpdated: string;
  isbn: string | null;
  sourceUrl: string | null;
}

@Injectable({ providedIn: 'root' })
export class BookCatalogService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly catalog = signal<CatalogBook[]>([]);
  private readonly adminUrl = '/api/admin/books';
  private loadVersion = 0;

  readonly books = this.catalog.asReadonly();
  readonly loading = signal(false);
  readonly error = signal('');

  constructor() {
    fromEvent(window, 'focus').pipe(takeUntilDestroyed()).subscribe(() => {
      if (this.auth.currentUser()) this.refresh();
    });
  }

  refresh(): void {
    if (!this.auth.currentUser()) return;
    const url = this.auth.currentUser()?.role === 'admin' ? this.adminUrl : '/api/books';
    const version = ++this.loadVersion;
    this.loading.set(true);
    this.error.set('');

    this.http.get<CatalogBook[]>(url, this.options()).subscribe({
      next: books => {
        if (version !== this.loadVersion) return;
        this.catalog.set(books);
        this.loading.set(false);
      },
      error: error => {
        if (version !== this.loadVersion) return;
        this.error.set(authErrorMessage(error, 'Unable to load the book catalog.'));
        this.loading.set(false);
      },
    });
  }

  save(details: BookDetails, id: number | null, expectedCopies: number | null) {
    const request = id === null
      ? this.http.post<CatalogBook>(this.adminUrl, details, this.options())
      : this.http.put<CatalogBook>(`${this.adminUrl}/${id}`, { ...details, expectedCopies }, this.options());
    return request.pipe(tap(book => this.updateBook(book)));
  }

  changeStatus(id: number, status: BookStatus) {
    return this.http.patch<CatalogBook>(`${this.adminUrl}/${id}/status`, { status }, this.options()).pipe(
      tap(book => this.updateBook(book)),
    );
  }

  remove(id: number) {
    return this.http.delete<void>(`${this.adminUrl}/${id}`, this.options()).pipe(
      tap(() => {
        this.catalog.update(books => books.filter(book => book.id !== id));
        this.refresh();
      }),
    );
  }

  private updateBook(book: CatalogBook): void {
    this.catalog.update(books => books.some(item => item.id === book.id)
      ? books.map(item => item.id === book.id ? book : item)
      : [...books, book]);
    this.refresh();
  }

  private options() {
    return { headers: this.auth.authorizationHeaders() };
  }
}
