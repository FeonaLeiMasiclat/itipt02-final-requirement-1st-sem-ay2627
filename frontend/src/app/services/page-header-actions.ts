import { computed, inject, Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { ShopService } from './shop.service';

@Injectable({ providedIn: 'root' })
export class PageHeaderActions {
  private readonly shop = inject(ShopService);
  readonly shopCartRequested = new Subject<void>();
  readonly shopCheckoutRequested = new Subject<void>();
  readonly wishlist = this.shop.wishlist;
  readonly shopWishlistCount = computed(() => this.wishlist().length);
  readonly shopCartCount = computed(() => this.shop.cart().reduce((count, item) => count + item.quantity, 0));
}
