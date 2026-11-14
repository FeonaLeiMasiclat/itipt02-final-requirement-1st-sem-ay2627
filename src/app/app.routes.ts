import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile.page').then((m) => m.ProfilePage),
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'reader_homepage',
    loadComponent: () =>
      import('./reader_homepage/reader_homepage.page').then((m) => m.ReaderHomepagePage),
  },
  {
    path: 'admin_homepage',
    loadComponent: () =>
      import('./admin_homepage/admin_homepage.page').then((m) => m.AdminHomepagePage),
  },
  {
    path: 'home',
    redirectTo: () =>
      localStorage.getItem('lmsUserRole') === 'admin'
        ? '/admin_homepage'
        : '/reader_homepage',
    pathMatch: 'full',
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'signup',
    loadComponent: () => import('./signup/signup.page').then((m) => m.SignupPage),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./forgot-password/forgot-password.page').then((m) => m.ForgotPasswordPage),
  },
  { path: 'dashboard', redirectTo: 'reader_homepage', pathMatch: 'full' },
  {
    path: 'shop',
    loadComponent: () => import('./shop/shop.page').then((m) => m.ShopPage),
  },
];
