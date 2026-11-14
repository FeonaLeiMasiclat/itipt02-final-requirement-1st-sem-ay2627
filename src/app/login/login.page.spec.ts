import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { LoginPage } from './login.page';

describe('LoginPage', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('routes the built-in reader credentials to the reader homepage', () => {
    const page = TestBed.createComponent(LoginPage).componentInstance;
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    page.username = 'user';
    page.password = 'user';

    page.login();

    expect(localStorage.getItem('lmsDisplayName')).toBe('user');
    expect(localStorage.getItem('lmsUserRole')).toBe('reader');
    expect(navigate).toHaveBeenCalledWith(['/reader_homepage']);
  });
});
