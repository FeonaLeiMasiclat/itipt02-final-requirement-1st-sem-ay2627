import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReaderHomePage } from './reader-home.page';
import { AuthService } from '../services/auth_service';
import { PageHeaderActions } from '../services/page-header-actions';

describe('ReaderHomePage', () => {
  let component: ReaderHomePage;
  let fixture: ComponentFixture<ReaderHomePage>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    fixture = TestBed.createComponent(ReaderHomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('adds and removes the displayed book with the wishlist heart', () => {
    const http = TestBed.inject(HttpTestingController);
    TestBed.inject(AuthService).login('reader', 'demo-password').subscribe();
    http.expectOne('/api/login').flush({ token: 'test-token', user: { id: 1, role: 'reader' } });

    component.ionViewWillEnter();
    const catalog = http.expectOne({ method: 'GET', url: '/api/books' });
    expect(catalog.request.headers.get('Authorization')).toBe('Bearer test-token');
    catalog.flush([{
      id: 2_000_001, title: 'His Unwritten Promise', author: 'Cy Caleb Reid', copies: 8,
      status: 'Active', lastUpdated: '2026-11-21', genre: 'Romance', price: 350,
      rating: 4.8, reviews: 120, synopsis: '', isbn: null, sourceUrl: null,
    }]);
    http.expectOne('/api/shop').flush({ cart: [], wishlist: [], orders: [] });

    const book = component.filteredBooks()[0];
    const wishlist = TestBed.inject(PageHeaderActions);
    fixture.detectChanges();

    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.wishlist-button')!;
    const icon = button.querySelector<HTMLIonIconElement>('ion-icon')!;
    expect(button.classList.contains('wishlisted')).toBe(false);
    expect(icon.name).toBe('heart-outline');

    button.click();
    const item = { id: book.id, title: book.title, price: book.price };
    http.expectOne({ method: 'PUT', url: `/api/wishlist/${book.id}` }).flush([item]);
    http.expectOne('/api/shop').flush({ cart: [], wishlist: [item], orders: [] });
    fixture.detectChanges();

    expect(wishlist.wishlist()).toContainEqual(item);
    expect(button.classList.contains('wishlisted')).toBe(true);
    expect(icon.name).toBe('heart');

    button.click();
    http.expectOne({ method: 'DELETE', url: `/api/wishlist/${book.id}` }).flush([]);
    http.expectOne('/api/shop').flush({ cart: [], wishlist: [], orders: [] });
    fixture.detectChanges();

    expect(wishlist.wishlist().some(item => item.id === book.id)).toBe(false);
    expect(button.classList.contains('wishlisted')).toBe(false);
    expect(icon.name).toBe('heart-outline');
    http.verify();
  });
});
