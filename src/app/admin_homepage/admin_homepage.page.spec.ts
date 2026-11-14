import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AdminHomepagePage } from './admin_homepage.page';

describe('AdminHomepagePage', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [AdminHomepagePage],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('adds and persists a catalog book', () => {
    const page = TestBed.createComponent(AdminHomepagePage).componentInstance;
    page.ngOnInit();
    page.openAddBook();
    page.draft = { title: 'New Book', author: 'A. Reader', copies: 3 };

    page.saveBook();

    expect(page.books).toHaveLength(2);
    expect(page.books[1]).toMatchObject({
      title: 'New Book',
      author: 'A. Reader',
      copies: 3,
      status: 'Active',
    });
    expect(localStorage.getItem('lmsAdminBooks')).toContain('New Book');
  });

  it('updates and saves borrow request decisions', () => {
    const page = TestBed.createComponent(AdminHomepagePage).componentInstance;
    page.ngOnInit();
    page.borrowRequests = [
      {
        id: 'request-1',
        bookTitle: 'Requested Book',
        requestedBy: 'Reader',
        requestedAt: '2026-11-14T00:00:00.000Z',
        status: 'Pending',
      },
    ];

    page.updateRequest(page.borrowRequests[0], 'Approved');

    expect(page.pendingRequests).toHaveLength(0);
    expect(localStorage.getItem('lmsBorrowRequests')).toContain('Approved');
  });
});
