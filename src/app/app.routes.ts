import { inject } from '@angular/core';
import { Router, type CanActivateFn, type Routes } from '@angular/router';

const readerGuard: CanActivateFn = () => {
  const role = localStorage.getItem('lmsUserRole');

  if (role === 'reader') {
    return true;
  }

  return inject(Router).createUrlTree([role === 'admin' ? '/admin_homepage' : '/login']);
};

const adminGuard: CanActivateFn = () => {
  const role = localStorage.getItem('lmsUserRole');

  if (role === 'admin') {
    return true;
  }

  return inject(Router).createUrlTree([role === 'reader' ? '/reader_homepage' : '/login']);
};

export const routes: Routes = [
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile.page').then((m) => m.ProfilePage),
    canActivate: [readerGuard],
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'reader_homepage',
    loadComponent: () =>
      import('./reader_homepage/reader_homepage.page').then((m) => m.ReaderHomepagePage),
    canActivate: [readerGuard],
  },
  {
    path: 'admin_homepage',
    loadComponent: () =>
      import('./admin_homepage/admin_homepage.page').then((m) => m.AdminHomepagePage),
    canActivate: [adminGuard],
  },
  {
    path: 'home',
    redirectTo: () => {
      const role = localStorage.getItem('lmsUserRole');

      if (role === 'admin') {
        return '/admin_homepage';
      }

      if (role === 'reader') {
        return '/reader_homepage';
      }

      return '/login';
    },
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
  { path: 'dashboard', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'shop',
    loadComponent: () => import('./shop/shop.page').then((m) => m.ShopPage),
    canActivate: [readerGuard],
  },
];
