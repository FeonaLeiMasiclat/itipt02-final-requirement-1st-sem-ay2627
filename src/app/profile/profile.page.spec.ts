import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ProfilePage } from './profile.page';

const counterOrders = [
  {
    id: 'LMS-2026-0001',
    items: [{ title: 'The Rain in España', author: 'Gwy Saludes', price: 520, quantity: 1 }],
    bookPrice: 520,
    total: 520,
    pickupLocation: 'Main Library Counter',
    paymentMethod: 'Counter Cash',
    createdAt: '2026-11-14T12:00:00.000Z',
  },
  {
    id: 'LMS-2026-0002',
    items: [{ title: 'Safe Skies, Archer', author: 'Scott G. Elwell', price: 435, quantity: 2 }],
    bookPrice: 870,
    total: 870,
    pickupLocation: 'Main Library Counter',
    paymentMethod: 'Counter Cash',
    createdAt: '2026-11-14T12:30:00.000Z',
  },
];

describe('ProfilePage counter orders', () => {
  beforeEach(async () => {
    localStorage.clear();
    localStorage.setItem('lmsCounterOrders', JSON.stringify(counterOrders));
    await TestBed.configureTestingModule({
      imports: [ProfilePage],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('counts saved pending counter orders', () => {
    const page = TestBed.createComponent(ProfilePage).componentInstance;

    expect(page.readyOrderCount).toBe(2);
  });

  it('shows the selected order receipt with its real order details', () => {
    const fixture = TestBed.createComponent(ProfilePage);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('2 Ready');

    const receiptButton = fixture.nativeElement.querySelector('.receipt-button') as HTMLButtonElement;
    receiptButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Counter Payment Receipt');
    expect(fixture.nativeElement.textContent).toContain('LMS-2026-0001');
    expect(fixture.nativeElement.textContent).toContain('The Rain in España');
    expect(fixture.nativeElement.textContent).toContain('₱ 520');
  });

  it('opens the reading session from Start Reading', () => {
    const page = TestBed.createComponent(ProfilePage).componentInstance;

    page.startReading();

    expect(page.readingModalOpen).toBe(true);
    page.closeReadingModal();
    expect(page.readingModalOpen).toBe(false);
  });

  it('keeps only the title, author, and Start Reading action in the owned book card', () => {
    const fixture = TestBed.createComponent(ProfilePage);
    fixture.detectChanges();

    const ownedBook = fixture.nativeElement.querySelector('.owned-book') as HTMLElement;
    expect(ownedBook.textContent).toContain('The Rain in España');
    expect(ownedBook.textContent).toContain('Gwy Saludes');
    expect(ownedBook.querySelectorAll('button')).toHaveLength(1);
    expect(ownedBook.textContent).toContain('Start Reading');
    expect(ownedBook.textContent).not.toContain('Renew Book');
    expect(ownedBook.textContent).not.toContain('Reading Progress');
  });
});
