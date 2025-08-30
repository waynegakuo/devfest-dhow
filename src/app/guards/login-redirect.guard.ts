import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

/**
 * Guard that redirects authenticated users away from login route to helm dashboard
 * If user is already logged in and tries to access login, redirect them to helm
 */
export const loginRedirectGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // If user is authenticated, redirect to helm dashboard
  if (authService.isAuthenticated()) {
    return router.createUrlTree(['/helm']);
  }

  // If user is not authenticated, allow access to login route
  return true;
};
