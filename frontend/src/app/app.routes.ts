import type { Routes } from '@angular/router';
import { requireAdmin, requireReader } from './services/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'signup',
    loadComponent: () => import('./signup/signup.page').then(m => m.SignupPage)
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./forgot_password/forgot-password.page').then(m => m.ForgotPasswordPage)
  },
  {
    path: 'admin-home',
    canActivate: [requireAdmin],
    loadComponent: () =>
      import('./admin_home/admin-home.page').then(m => m.AdminHomePage)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: '',
    loadComponent: () => import('./home/home.page').then(m => m.HomePage),
    canActivateChild: [requireReader],
    children: [
      {
        path: 'reader-home',
        loadComponent: () =>
          import('./reader_home/reader-home.page').then(m => m.ReaderHomePage)
      },
      {
        path: 'book-shop',
        loadComponent: () =>
          import('./book_shop/book-shop.page').then(m => m.BookShopPage)
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./profile/profile.page').then(m => m.ProfilePage)
      },
      {
        path: 'home',
        redirectTo: 'reader-home',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
