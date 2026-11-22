import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent, tap } from 'rxjs';

import { AuthService, authErrorMessage } from './auth_service';
import { BookCatalogService, BookStatus } from './book-catalog.service';

export type BorrowStatus = 'Pending' | 'Approved' | 'Declined' | 'Return Pending' | 'Returned';
export type BorrowDecision = 'Approved' | 'Declined';

export interface BorrowRequest {
  id: number;
  bookId: number | null;
  bookTitle: string;
  author: string;
  kind: 'Borrow' | 'Acquisition';
  status: BorrowStatus;
  readerName: string;
  requestedAt: string;
  returnRequestedAt: string | null;
  returnedAt: string | null;
  dueDate: string | null;
  bookStatus: BookStatus | null;
  genre: string | null;
  availableCopies: number | null;
  price: number | null;
  rating: number | null;
  reviews: number | null;
  synopsis: string | null;
}

@Injectable({ providedIn: 'root' })
export class BorrowingService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly catalog = inject(BookCatalogService);
  private readonly records = signal<{ userId: number; requests: BorrowRequest[] } | null>(null);
  private readonly readerUrl = '/api/borrow-requests';
  private readonly adminUrl = '/api/admin/borrow-requests';
  private loadVersion = 0;

  readonly requests = computed(() => {
    const records = this.records();
    return records?.userId === this.auth.currentUser()?.id ? records?.requests ?? [] : [];
  });
  readonly loading = signal(false);
  readonly error = signal('');

  constructor() {
    fromEvent(window, 'focus').pipe(takeUntilDestroyed()).subscribe(() => this.refresh());
  }

  refresh(): void {
    const user = this.auth.currentUser();
    if (!user) return;
    const version = ++this.loadVersion;
    const url = user.role === 'admin' ? this.adminUrl : this.readerUrl;
    this.loading.set(true);
    this.error.set('');
    this.http.get<BorrowRequest[]>(url, this.options()).subscribe({
      next: requests => {
        if (version !== this.loadVersion || user.id !== this.auth.currentUser()?.id) return;
        this.records.set({ userId: user.id, requests });
        this.loading.set(false);
      },
      error: error => {
        if (version !== this.loadVersion || user.id !== this.auth.currentUser()?.id) return;
        this.error.set(authErrorMessage(error, 'Unable to load book requests.'));
        this.loading.set(false);
      },
    });
  }

  requestBook(bookId: number) {
    return this.http.post<BorrowRequest>(this.readerUrl, { bookId }, this.options()).pipe(
      tap(() => this.refresh()),
    );
  }

  requestAcquisition(title: string, author: string) {
    return this.http.post<BorrowRequest>('/api/acquisition-requests', { title, author }, this.options()).pipe(
      tap(() => this.refresh()),
    );
  }

  decide(id: number, status: BorrowDecision) {
    return this.http.patch<BorrowRequest>(`${this.adminUrl}/${id}`, { status }, this.options()).pipe(
      tap(request => {
        this.refresh();
        if (request.kind === 'Borrow' && request.status === 'Approved') this.catalog.refresh();
      }),
    );
  }

  requestReturn(id: number) {
    return this.http.post<BorrowRequest>(`${this.readerUrl}/${id}/return`, {}, this.options()).pipe(
      tap(() => this.refresh()),
    );
  }

  confirmReturn(id: number) {
    return this.http.post<BorrowRequest>(`${this.adminUrl}/${id}/confirm-return`, {}, this.options()).pipe(
      tap(() => {
        this.refresh();
        this.catalog.refresh();
      }),
    );
  }

  private options() {
    return { headers: this.auth.authorizationHeaders() };
  }
}
