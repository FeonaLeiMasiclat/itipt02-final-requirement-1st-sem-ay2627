import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

import { ReaderHomepagePage } from './reader_homepage.page';

describe('ReaderHomepagePage logout confirmation', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ReaderHomepagePage],
      providers: [provideRouter([]), { provide: AlertController, useValue: {} }],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('opens and cancels the logout modal without ending the session', () => {
    localStorage.setItem('lmsUserRole', 'reader');
    const page = TestBed.createComponent(ReaderHomepagePage).componentInstance;

    page.openLogoutModal();
    expect(page.logoutModalOpen).toBe(true);

    page.cancelLogout();
    expect(page.logoutModalOpen).toBe(false);
    expect(localStorage.getItem('lmsUserRole')).toBe('reader');
  });

  it('clears the reader session and returns to login after confirmation', () => {
    localStorage.setItem('lmsUserRole', 'reader');
    localStorage.setItem('lmsDisplayName', 'user');
    localStorage.setItem('savedCart', 'cart-data');
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const page = TestBed.createComponent(ReaderHomepagePage).componentInstance;

    page.confirmLogout();

    expect(page.logoutModalOpen).toBe(false);
    expect(localStorage.getItem('lmsUserRole')).toBeNull();
    expect(localStorage.getItem('lmsDisplayName')).toBeNull();
    expect(localStorage.getItem('savedCart')).toBe('cart-data');
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
