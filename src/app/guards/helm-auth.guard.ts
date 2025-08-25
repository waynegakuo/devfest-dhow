import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

/**
 * Guard that protects the helm dashboard route from unauthenticated access
 * If user is not logged in and tries to access helm, redirect them to login
 */
export const helmAuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // If user is not authenticated, redirect to login page
  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  // If user is authenticated, allow access to helm route
  return true;
};
