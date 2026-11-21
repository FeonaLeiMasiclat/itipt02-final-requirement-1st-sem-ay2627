import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BookShopPage } from './book-shop.page';

describe('BookShopPage', () => {
  let component: BookShopPage;
  let fixture: ComponentFixture<BookShopPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BookShopPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows and toggles the Ionicon wishlist heart on a book', () => {
    const bookId = component.books()[0].id;
    component.removeWishlist(bookId);
    fixture.detectChanges();

    const favoriteButton = fixture.nativeElement.querySelector(
      '.favorite-button'
    ) as HTMLElement;

    favoriteButton.click();
    fixture.detectChanges();

    expect(favoriteButton.getAttribute('aria-pressed')).toBe('true');
    expect(favoriteButton.querySelector('ion-icon')?.getAttribute('name')).toBe('heart');

    favoriteButton.click();
    fixture.detectChanges();

    expect(favoriteButton.getAttribute('aria-pressed')).toBe('false');
    expect(favoriteButton.querySelector('ion-icon')?.getAttribute('name')).toBe('heart-outline');
  });
});
