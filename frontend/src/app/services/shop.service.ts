import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent, tap } from 'rxjs';

import { AuthService, authErrorMessage } from './auth_service';
import { BookCatalogService, BookStatus } from './book-catalog.service';

export interface WishlistItem {
  id: number;
  title: string;
  price: number;
}

export interface CartItem extends WishlistItem {
  author: string;
  quantity: number;
  availableCopies: number;
  status: BookStatus;
}

export interface OrderItem extends WishlistItem {
  bookId: number | null;
  author: string;
  quantity: number;
}

export interface ShopOrder {
  orderId: string;
  buyerName: string;
  date: string;
  total: number;
  items: OrderItem[];
  status: 'Awaiting Pickup';
  paymentMethod: 'Counter Cash';
}

export interface OrderCustomer {
  id: number;
  name: string;
  username: string | null;
  orderCount: number;
}

interface ShopState {
  cart: CartItem[];
  wishlist: WishlistItem[];
  orders: ShopOrder[];
}

export interface Checkout {
  source: 'cart' | 'direct';
  items: Array<{ bookId: number; quantity: number }>;
}

@Injectable({ providedIn: 'root' })
export class ShopService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly catalog = inject(BookCatalogService);
  private readonly stored = signal<{ userId: number; state: ShopState } | null>(null);
  private readonly state = computed(() => {
    const saved = this.stored();
    return saved?.userId === this.auth.currentUser()?.id ? saved?.state : undefined;
  });
  private version = 0;

  readonly cart = computed(() => this.state()?.cart ?? []);
  readonly wishlist = computed(() => this.state()?.wishlist ?? []);
  readonly orders = computed(() => this.state()?.orders ?? []);
  readonly loading = signal(false);
  readonly error = signal('');

  constructor() {
    fromEvent(window, 'focus').pipe(takeUntilDestroyed()).subscribe(() => this.refresh());
  }

  refresh(): void {
    const user = this.auth.currentUser();
    if (user?.role !== 'reader') return;
    const version = ++this.version;
    this.loading.set(true);
    this.error.set('');
    this.http.get<ShopState>('/api/shop', this.options()).subscribe({
      next: state => {
        if (version !== this.version || user.id !== this.auth.currentUser()?.id) return;
        this.stored.set({ userId: user.id, state });
        this.loading.set(false);
      },
      error: error => {
        if (version !== this.version || user.id !== this.auth.currentUser()?.id) return;
        this.error.set(authErrorMessage(error, 'Unable to load your shop records.'));
        this.loading.set(false);
      },
    });
  }

  changeCart(bookId: number, delta: -1 | 1) {
    const userId = this.auth.currentUser()?.id;
    return this.http.patch<CartItem[]>(`/api/cart/${bookId}`, { delta }, this.options()).pipe(
      tap(cart => this.update(userId, { cart })),
    );
  }

  removeFromCart(bookId: number) {
    const userId = this.auth.currentUser()?.id;
    return this.http.delete<CartItem[]>(`/api/cart/${bookId}`, this.options()).pipe(
      tap(cart => this.update(userId, { cart })),
    );
  }

  setWishlisted(bookId: number, selected: boolean) {
    const userId = this.auth.currentUser()?.id;
    const url = `/api/wishlist/${bookId}`;
    const action = selected
      ? this.http.put<WishlistItem[]>(url, {}, this.options())
      : this.http.delete<WishlistItem[]>(url, this.options());
    return action.pipe(tap(wishlist => this.update(userId, { wishlist })));
  }

  checkout(data: Checkout, requestKey: string) {
    const userId = this.auth.currentUser()?.id;
    return this.http.post<ShopOrder>('/api/checkout', { ...data, requestKey }, this.options()).pipe(
      tap(order => {
        const orders = [order, ...this.orders().filter(item => item.orderId !== order.orderId)];
        this.update(userId, { orders });
        this.catalog.refresh();
      }),
    );
  }

  adminOrders(buyerId: number) {
    return this.http.get<ShopOrder[]>('/api/admin/orders', {
      ...this.options(), params: { buyerId },
    });
  }

  orderCustomers() {
    return this.http.get<OrderCustomer[]>('/api/admin/order-customers', this.options());
  }

  private update(userId: number | undefined, change: Partial<ShopState>): void {
    if (userId === undefined || userId !== this.auth.currentUser()?.id) return;
    const state = this.state() ?? { cart: [], wishlist: [], orders: [] };
    this.stored.set({ userId, state: { ...state, ...change } });
    this.refresh();
  }

  private options() {
    return { headers: this.auth.authorizationHeaders() };
  }
}
