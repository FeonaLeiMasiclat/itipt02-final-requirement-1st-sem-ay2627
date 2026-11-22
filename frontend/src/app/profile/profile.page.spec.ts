import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfilePage } from './profile.page';
import { AuthService } from '../services/auth_service';
import { BorrowRequest } from '../services/borrowing.service';
import { CartItem, ShopOrder } from '../services/shop.service';

describe('ProfilePage', () => {
  let component: ProfilePage;
  let fixture: ComponentFixture<ProfilePage>;
  let http: HttpTestingController;

  const loan: BorrowRequest = {
    id: 30, bookId: 10, bookTitle: 'Safe Skies, Archer', author: 'Gwy Saludes',
    kind: 'Borrow', status: 'Approved', readerName: 'Demo Reader',
    requestedAt: '2026-11-22T01:02:03Z', returnRequestedAt: null, returnedAt: null, dueDate: '2026-12-06',
    bookStatus: 'Active', genre: 'Romance', availableCopies: 2,
    price: 350, rating: 4.5, reviews: 2, synopsis: null,
  };
  const pendingReturn: BorrowRequest = {
    ...loan, status: 'Return Pending', returnRequestedAt: '2026-11-23T01:02:03Z',
  };
  const returnedLoan: BorrowRequest = {
    ...pendingReturn, status: 'Returned', returnedAt: '2026-11-23T02:02:03Z', availableCopies: 3,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    fixture = TestBed.createComponent(ProfilePage);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function loadProfile(requests: BorrowRequest[] = [], cart: CartItem[] = [], orders: ShopOrder[] = []): void {
    TestBed.inject(AuthService).login('reader', 'demo-password').subscribe();
    http.expectOne('/api/login').flush({ token: 'test-token', user: { id: 1, role: 'reader' } });
    component.ionViewWillEnter();
    http.expectOne('/api/borrow-requests').flush(requests);
    http.expectOne('/api/shop').flush({ cart, wishlist: [], orders });
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('closes the selected statistics panel with its close button', () => {
    component.showSection('cart');
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('#profile-cart-title')?.textContent).toBe('Your Book Cart');

    page.querySelector<HTMLElement>('ion-button[aria-label="Close cart"]')!.click();
    fixture.detectChanges();

    expect(component.selectedSection()).toBe('');
    expect(page.querySelector('#profile-cart-title')).toBeNull();
  });

  it('shows cart items and their total in the cart panel', () => {
    loadProfile([], [
      {
        id: 1,
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        price: 350,
        quantity: 2,
        availableCopies: 10,
        status: 'Active'
      }
    ]);

    component.showSection('cart');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('The Great Gatsby');
    expect(fixture.nativeElement.textContent).toContain('₱700.00');
    expect(component.addToCartCount()).toBe(2);
  });

  it('shows overdue fines and generates a counter payment slip', () => {
    component.showSection('fines');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Whispers in the Attic');
    expect(fixture.nativeElement.textContent).toContain('₱45.00');

    const generateButton = fixture.nativeElement.querySelector(
      '.generate-fine-slip-button'
    ) as HTMLElement;
    generateButton.click();
    fixture.detectChanges();

    expect(component.counterPaymentSlip()?.total).toBe(45);
  });

  it('shows counter order details and statuses', () => {
    loadProfile([], [], [{
      orderId: 'LMS-2026-0012', buyerName: 'Demo Reader', date: '2026-11-22T01:02:03Z',
      total: 310, status: 'Awaiting Pickup', paymentMethod: 'Counter Cash',
      items: [{ id: 2, bookId: 1, title: 'Chasing in the Wild', author: 'Gwy Saludes', price: 310, quantity: 1 }],
    }]);
    component.showSection('counter');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('LMS-2026-0012');
    expect(fixture.nativeElement.textContent).toContain('Chasing in the Wild');
    expect(fixture.nativeElement.textContent).toContain('Awaiting Pickup');
  });

  it('keeps a return outstanding until confirmation and then allows a new borrow request', () => {
    loadProfile([loan]);
    expect(component.borrowedCount()).toBe(1);
    component.returnBorrowRequest(loan.id);
    http.expectOne({ method: 'POST', url: '/api/borrow-requests/30/return' }).flush(pendingReturn);
    http.expectOne('/api/borrow-requests').flush([pendingReturn]);
    http.expectNone('/api/books');
    expect(component.ownedBooks()).toEqual([pendingReturn]);
    expect(component.archivedBooks()).toEqual([]);
    component.reborrowBook(loan.id);
    http.expectNone({ method: 'POST', url: '/api/borrow-requests' });

    component.borrowing.refresh();
    http.expectOne('/api/borrow-requests').flush([returnedLoan]);
    expect(component.borrowedCount()).toBe(0);
    expect(component.archivedBooks()).toEqual([returnedLoan]);

    component.reborrowBook(loan.id);
    const request = http.expectOne({ method: 'POST', url: '/api/borrow-requests' });
    expect(request.request.body).toEqual({ bookId: loan.bookId });
    const pendingLoan: BorrowRequest = { ...loan, id: 31, status: 'Pending', dueDate: null };
    request.flush(pendingLoan);
    http.expectOne('/api/borrow-requests').flush([pendingLoan, returnedLoan]);

    expect(component.borrowedCount()).toBe(0);
    expect(component.archiveCount()).toBe(1);
    expect(component.readerBorrowRequests()[0].status).toBe('Pending');
  });

  it('filters archived books by title and author', () => {
    loadProfile([returnedLoan]);
    component.updateArchiveSearch(
      new CustomEvent('ionInput', { detail: { value: 'safe skies' } })
    );

    expect(component.filteredArchiveBooks().map(book => book.bookTitle)).toEqual([
      'Safe Skies, Archer'
    ]);
    component.updateArchiveSearch(new CustomEvent('ionInput', { detail: { value: 'gwy' } }));
    expect(component.filteredArchiveBooks()).toEqual([returnedLoan]);
  });
});
