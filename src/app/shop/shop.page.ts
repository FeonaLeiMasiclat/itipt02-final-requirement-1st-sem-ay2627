import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { IonContent } from '@ionic/angular';

import { loadBorrowRequests, saveBorrowRequests } from '../shared/borrow-requests';
import type { BorrowRequest } from '../shared/borrow-requests';

interface ShopCartItem {
  title: string;
  author: string;
  price: number;
  selected: boolean;
  quantity: number;
}

interface CounterOrderItem {
  title: string;
  author: string;
  price: number;
  quantity: number;
}

interface CounterOrder {
  id: string;
  items: CounterOrderItem[];
  bookPrice: number;
  total: number;
  pickupLocation: string;
  paymentMethod: string;
  createdAt: string;
}

type ShopFilter = 'All Available' | 'Recently Added' | 'By Series' | 'Reading Progress' | 'On Sale';

interface ShopBook {
  title: string;
  author: string;
  price: number;
  cover: string;
  filters: ShopFilter[];
}

interface WishlistItem {
  title: string;
  price: number;
}

const COUNTER_ORDERS_STORAGE_KEY = 'lmsCounterOrders';

function isCounterOrder(value: unknown): value is CounterOrder {
  if (typeof value !== 'object' || value === null) return false;
  const order = value as Record<string, unknown>;
  return (
    typeof order['id'] === 'string' &&
    Array.isArray(order['items']) &&
    typeof order['bookPrice'] === 'number' &&
    typeof order['total'] === 'number' &&
    typeof order['pickupLocation'] === 'string' &&
    typeof order['paymentMethod'] === 'string' &&
    typeof order['createdAt'] === 'string'
  );
}

@Component({
  selector: 'app-shop',
  templateUrl: './shop.page.html',
  styleUrls: ['./shop.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, RouterLink, RouterLinkActive],
})
export class ShopPage {
  private readonly route = inject(ActivatedRoute);
  wishlistOpen = false;
  menuOpen = false;
  cartOpen = false;
  checkoutOpen = false;
  receiptOpen = false;
  acquisitionModalOpen = false;
  selectedBookTitle = '';
  selectedAuthor = '';
  searchTerm = '';
  activeFilter: ShopFilter = 'All Available';
  readonly shopFilters: ShopFilter[] = ['All Available', 'Recently Added', 'By Series', 'Reading Progress', 'On Sale'];
  readonly availableBooks: ShopBook[] = [
    { title: 'His Unwritten Promise', author: 'Caleb Reed', price: 520, cover: 'warm-cover', filters: ['All Available', 'Recently Added', 'By Series', 'Reading Progress'] },
    { title: 'Dear Future Ex', author: 'Matt Haig', price: 435, cover: 'stack-cover', filters: ['All Available', 'Recently Added', 'By Series'] },
    { title: 'How Great Books Go', author: 'Gabrielle Reyes', price: 490, cover: 'gold-cover', filters: ['All Available', 'On Sale'] },
    { title: 'The Midnight Library', author: 'Matt Kingly', price: 450, cover: 'blue-cover', filters: ['All Available', 'On Sale', 'Reading Progress'] },
  ];
  readonly acquisitionBooks = [
    { title: 'The Midnight Library', author: 'Matt Haig' },
    { title: 'His Unwritten Promise', author: 'Caleb Reed' },
    { title: 'Dear Future Ex', author: 'Matt Kingly' },
    { title: 'The Rain in España', author: 'Gwy Saludes' },
  ];
  checkoutOrderId = '';
  completedOrder: CounterOrder | null = null;
  cartItems = [
    { title: 'The Rain in España', author: 'Gwy Saludes', price: 520, selected: true, quantity: 1 },
    { title: 'Safe Skies, Archer', author: 'Scott G. Elwell', price: 520, selected: false, quantity: 1 },
    {
      title: 'Golden Scenery of Tomorrow',
      author: 'A. Reader',
      price: 520,
      selected: true,
      quantity: 1,
    },
  ];
  wishlistItems: WishlistItem[] = [
    { title: 'The Rain In Espana', price: 520 },
    { title: 'Safe Skies, Archer', price: 520 },
    { title: 'Golden Scenery of Tomorrow', price: 520 },
  ];
  recentlyRemovedWishlistItem: WishlistItem | null = null;

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      if (params.get('wishlist') === 'true') this.wishlistOpen = true;
    });
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }
  closeMenu(): void {
    this.menuOpen = false;
  }
  toggleCart(): void {
    this.cartOpen = !this.cartOpen;
  }
  closeCart(): void {
    this.cartOpen = false;
    this.checkoutOpen = false;
  }
  removeCartItem(title: string): void {
    this.cartItems = this.cartItems.filter((item) => item.title !== title);
  }
  get selectedCartItems(): ShopCartItem[] {
    return this.cartItems.filter((item) => item.selected);
  }

  get bookPrice(): number {
    return this.selectedCartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  }

  get checkoutTotal(): number {
    return this.bookPrice;
  }

  checkout(): void {
    if (!this.selectedCartItems.length) return;
    this.checkoutOrderId = this.createOrderId();
    this.cartOpen = true;
    this.checkoutOpen = true;
  }

  returnToCart(): void {
    this.checkoutOpen = false;
  }

  changeQuantity(item: ShopCartItem, delta: number): void {
    item.quantity = Math.max(1, item.quantity + delta);
  }

  addToCart(title: string, author: string, price: number): void {
    const item = this.cartItems.find((cartItem) => cartItem.title === title);
    if (item) {
      item.quantity += 1;
      item.selected = true;
    } else {
      this.cartItems = [...this.cartItems, { title, author, price, selected: true, quantity: 1 }];
    }
    this.cartOpen = true;
  }

  buyNow(title: string, author: string, price: number): void {
    this.addToCart(title, author, price);
    this.checkout();
  }

  confirmCheckout(): void {
    const items: CounterOrderItem[] = this.selectedCartItems.map(({ title, author, price, quantity }) => ({
      title,
      author,
      price,
      quantity,
    }));
    if (!items.length) return;

    const order: CounterOrder = {
      id: this.checkoutOrderId,
      items,
      bookPrice: this.bookPrice,
      total: this.checkoutTotal,
      pickupLocation: 'Main Library Counter',
      paymentMethod: 'Counter Cash',
      createdAt: new Date().toISOString(),
    };
    const orders = this.readCounterOrders();
    orders.push(order);
    localStorage.setItem(COUNTER_ORDERS_STORAGE_KEY, JSON.stringify(orders));

    this.completedOrder = order;
    this.cartItems = this.cartItems.filter((item) => !item.selected);
    this.cartOpen = false;
    this.checkoutOpen = false;
    this.receiptOpen = true;
  }

  closeReceipt(): void {
    this.receiptOpen = false;
  }

  private createOrderId(): string {
    const nextNumber = this.readCounterOrders().length + 1;
    return `LMS-${new Date().getFullYear()}-${String(nextNumber).padStart(4, '0')}`;
  }

  private readCounterOrders(): CounterOrder[] {
    const storedOrders = localStorage.getItem(COUNTER_ORDERS_STORAGE_KEY);
    if (storedOrders === null) return [];

    const parsedOrders: unknown = JSON.parse(storedOrders);
    if (!Array.isArray(parsedOrders) || !parsedOrders.every(isCounterOrder)) {
      throw new Error('Saved counter order data has an invalid format.');
    }
    return parsedOrders;
  }

  toggleWishlist(): void {
    this.wishlistOpen = !this.wishlistOpen;
  }

  closeWishlist(): void {
    this.wishlistOpen = false;
  }

  toggleWishlistItem(book: ShopBook): void {
    if (this.isInWishlist(book.title)) {
      this.removeWishlistItem(book.title);
      return;
    }

    this.recentlyRemovedWishlistItem = null;
    this.wishlistItems = [...this.wishlistItems, { title: book.title, price: book.price }];
  }

  isInWishlist(title: string): boolean {
    return this.wishlistItems.some((item) => item.title === title);
  }

  removeWishlistItem(title: string): void {
    const removedItem = this.wishlistItems.find((item) => item.title === title);
    if (!removedItem) return;

    this.recentlyRemovedWishlistItem = removedItem;
    this.wishlistItems = this.wishlistItems.filter((item) => item.title !== title);
  }

  undoWishlistRemoval(): void {
    const item = this.recentlyRemovedWishlistItem;
    if (!item) return;

    if (!this.isInWishlist(item.title)) {
      this.wishlistItems = [...this.wishlistItems, item];
    }
    this.recentlyRemovedWishlistItem = null;
  }

  selectFilter(filter: ShopFilter): void {
    this.activeFilter = filter;
  }

  get visibleBooks(): ShopBook[] {
    const term = this.searchTerm.trim().toLocaleLowerCase();
    return this.availableBooks.filter((book) => {
      const matchesFilter = this.activeFilter === 'All Available' || book.filters.includes(this.activeFilter);
      const matchesSearch = !term || `${book.title} ${book.author}`.toLocaleLowerCase().includes(term);
      return matchesFilter && matchesSearch;
    });
  }

  requestAcquisition(): void {
    this.selectedBookTitle = '';
    this.selectedAuthor = '';
    this.acquisitionModalOpen = true;
  }

  cancelAcquisition(): void {
    this.acquisitionModalOpen = false;
  }

  submitAcquisition(): void {
    if (!this.selectedBookTitle || !this.selectedAuthor) return;

    const requests: BorrowRequest[] = loadBorrowRequests();
    requests.push({
      id: `${Date.now()}`,
      bookTitle: this.selectedBookTitle,
      author: this.selectedAuthor,
      requestedBy: localStorage.getItem('lmsDisplayName') || 'Reader',
      requestedAt: new Date().toISOString(),
      status: 'Pending',
    });
    saveBorrowRequests(requests);
    this.acquisitionModalOpen = false;
  }
}
