import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { ShopPage } from './shop.page';

describe('ShopPage checkout', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ShopPage],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { queryParamMap: of(convertToParamMap({})) } },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('opens checkout with a calculated total for selected books', () => {
    const page = TestBed.createComponent(ShopPage).componentInstance;

    page.checkout();

    expect(page.checkoutOpen).toBe(true);
    expect(page.cartOpen).toBe(true);
    expect(page.selectedCartItems).toHaveLength(2);
    expect(page.bookPrice).toBe(1040);
    expect(page.checkoutTotal).toBe(1040);
    expect(page.checkoutOrderId).toMatch(/^LMS-\d{4}-0001$/);
  });

  it('removes only the selected book from the wishlist', () => {
    const page = TestBed.createComponent(ShopPage).componentInstance;

    page.removeWishlistItem('Safe Skies, Archer');

    expect(page.wishlistItems.map((item) => item.title)).toEqual([
      'The Rain In Espana',
      'Golden Scenery of Tomorrow',
    ]);
  });

  it('restores a removed wishlist item when undo is selected', () => {
    const page = TestBed.createComponent(ShopPage).componentInstance;
    const removedItem = page.wishlistItems[1];

    page.removeWishlistItem(removedItem.title);
    page.undoWishlistRemoval();

    expect(page.wishlistItems).toContain(removedItem);
    expect(page.recentlyRemovedWishlistItem).toBeNull();
    expect(page.wishlistOpen).toBe(false);
  });

  it('saves and removes a book through its heart button', () => {
    const page = TestBed.createComponent(ShopPage).componentInstance;
    const book = page.availableBooks[0];

    expect(page.wishlistCount).toBe(3);
    page.toggleWishlistItem(book);

    expect(page.isInWishlist(book.title)).toBe(true);
    expect(page.wishlistCount).toBe(4);
    expect(page.wishlistOpen).toBe(false);

    page.toggleWishlistItem(book);

    expect(page.isInWishlist(book.title)).toBe(false);
    expect(page.wishlistCount).toBe(3);
    expect(page.recentlyRemovedWishlistItem).toEqual({ title: book.title, price: book.price });
  });

  it('updates the cart badge count as item quantities change', () => {
    const page = TestBed.createComponent(ShopPage).componentInstance;

    expect(page.cartCount).toBe(3);
    page.addToCart('His Unwritten Promise', 'Caleb Reed', 520);
    expect(page.cartCount).toBe(4);

    page.removeCartItem('Safe Skies, Archer');
    expect(page.cartCount).toBe(3);
  });

  it('saves the confirmed order, removes purchased books, and shows its receipt', () => {
    const page = TestBed.createComponent(ShopPage).componentInstance;
    page.checkout();
    page.changeQuantity(page.selectedCartItems[0], 2);

    page.confirmCheckout();

    const orders = JSON.parse(localStorage.getItem('lmsCounterOrders') || '[]') as {
      id: string;
      total: number;
      items: { title: string; quantity: number }[];
    }[];
    expect(page.receiptOpen).toBe(true);
    expect(page.completedOrder?.id).toBe(orders[0].id);
    expect(orders[0].total).toBe(2080);
    expect(orders[0].items[0].quantity).toBe(3);
    expect(page.cartItems.map((item) => item.title)).toEqual(['Safe Skies, Archer']);
    expect(page.checkoutOpen).toBe(false);
    expect(page.cartOpen).toBe(false);
  });
});
