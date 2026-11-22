import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminHomePage } from './admin-home.page';

describe('AdminHomePage', () => {
  let component: AdminHomePage;
  let fixture: ComponentFixture<AdminHomePage>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    fixture = TestBed.createComponent(AdminHomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads order details only for the selected customer, including customers with the same name', () => {
    const http = TestBed.inject(HttpTestingController);
    const customers = [
      { id: 21, name: 'Alex Reader', username: 'alex-one', orderCount: 2 },
      { id: 22, name: 'Alex Reader', username: 'alex-two', orderCount: 1 },
    ];
    const order = {
      orderId: 'LMS-2026-0012', buyerName: 'Alex Reader', date: '2026-11-22T01:02:03Z',
      total: 310, status: 'Awaiting Pickup', paymentMethod: 'Counter Cash',
      items: [{ id: 2, bookId: 1, title: 'Test Book', author: 'Test Author', price: 310, quantity: 1 }],
    };

    component.openPurchasedBooks();
    http.expectOne('/api/admin/order-customers').flush(customers);
    expect(component.orderCustomers()).toEqual(customers);
    http.expectNone(request => request.url === '/api/admin/orders');

    component.showCustomerOrders(customers[0]);
    const firstRequest = http.expectOne('/api/admin/orders?buyerId=21');
    component.showOrderCustomers();
    expect(firstRequest.cancelled).toBe(true);
    http.expectOne('/api/admin/order-customers').flush(customers);

    component.showCustomerOrders(customers[1]);
    http.expectOne('/api/admin/orders?buyerId=22').flush([order]);
    expect(component.selectedCustomer()?.username).toBe('alex-two');
    expect(component.purchasedOrders()).toEqual([order]);
    http.verify();
  });
});
