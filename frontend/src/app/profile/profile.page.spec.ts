import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfilePage } from './profile.page';

describe('ProfilePage', () => {
  let component: ProfilePage;
  let fixture: ComponentFixture<ProfilePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfilePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('highlights a statistics card when selected', () => {
    const cartCard = fixture.nativeElement.querySelector('.stat-card') as HTMLElement;

    cartCard.click();
    fixture.detectChanges();

    expect(cartCard.classList.contains('selected')).toBe(true);
    expect(cartCard.getAttribute('aria-pressed')).toBe('true');
  });

  it('shows cart items and their total when the cart card is opened', () => {
    component.cartItems.set([
      {
        id: 1,
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        price: 350,
        quantity: 2,
        selected: true
      }
    ]);

    const cartCard = fixture.nativeElement.querySelector('.stat-card') as HTMLElement;
    cartCard.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('The Great Gatsby');
    expect(fixture.nativeElement.textContent).toContain('₱700.00');
    expect(component.addToCartCount()).toBe(2);
  });

  it('shows overdue fines and generates a counter payment slip', () => {
    const finesCard = fixture.nativeElement.querySelectorAll('.stat-card')[3] as HTMLElement;

    finesCard.click();
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
    const counterCard = fixture.nativeElement.querySelectorAll('.stat-card')[1] as HTMLElement;

    counterCard.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('ORD-4091');
    expect(fixture.nativeElement.textContent).toContain('Chasing in the Wild');
    expect(fixture.nativeElement.textContent).toContain('For Verification');
  });

  it('moves borrowed books into the archive and can re-borrow them', () => {
    component.returnBorrowedBook(1);

    expect(component.borrowedCount()).toBe(3);
    expect(component.archiveCount()).toBe(2);
    expect(component.archivedBooks().some(book => book.title === 'The Rain in España')).toBe(true);

    component.reborrowBook(1);

    expect(component.borrowedCount()).toBe(4);
    expect(component.archiveCount()).toBe(1);
  });

  it('filters archived books by title and author', () => {
    component.updateArchiveSearch(
      new CustomEvent('ionInput', { detail: { value: 'safe skies' } })
    );

    expect(component.filteredArchiveBooks().map(book => book.title)).toEqual([
      'Safe Skies, Archer'
    ]);
  });
});
