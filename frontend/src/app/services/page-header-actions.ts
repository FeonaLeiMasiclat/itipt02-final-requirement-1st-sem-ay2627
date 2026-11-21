import { computed, Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

export interface WishlistItem {
  id: number;
  title: string;
  price: number;
}

function loadWishlist(): WishlistItem[] {
  try {
    const savedWishlist = globalThis.localStorage?.getItem('wishlist');
    return savedWishlist ? (JSON.parse(savedWishlist) as WishlistItem[]) : [];
  } catch {
    return [];
  }
}

@Injectable({ providedIn: 'root' })
export class PageHeaderActions {
  readonly shopCartRequested = new Subject<void>();
  readonly wishlist = signal<WishlistItem[]>(loadWishlist());
  readonly shopWishlistCount = computed(() => this.wishlist().length);
  readonly shopCartCount = signal(0);

  saveWishlist(): void {
    globalThis.localStorage?.setItem('wishlist', JSON.stringify(this.wishlist()));
  }

  removeWishlist(bookId: number): void {
    this.wishlist.update(items => items.filter(item => item.id !== bookId));
    this.saveWishlist();
  }
}
