import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthService, LibraryUser } from './auth_service';

function requireRole(role: LibraryUser['role']) {
  return () => {
    const router = inject(Router);
    return inject(AuthService).refreshUser().pipe(
      map(user => {
        if (!user) return router.createUrlTree(['/login']);
        if (user.role === role) return true;
        return router.createUrlTree([user.role === 'admin' ? '/admin-home' : '/reader-home']);
      }),
    );
  };
}

export const requireAdmin = requireRole('admin');
export const requireReader = requireRole('reader');
