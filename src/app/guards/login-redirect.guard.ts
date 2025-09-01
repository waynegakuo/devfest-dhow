import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { first, map } from 'rxjs';
import { Auth, authState } from '@angular/fire/auth';

/**
 * Guard that redirects authenticated users away from login route to helm dashboard
 * If user is already logged in and tries to access login, redirect them to helm
 * Uses AngularFire's authState observable to wait for Firebase auth initialization
 */
export const loginRedirectGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const auth = inject(Auth);

  // Use AngularFire's authState observable to check authentication
  return authState(auth).pipe(
    first(), // Take only the first emission to avoid multiple checks
    map(user => {
      if (user) {
        // If user is authenticated, redirect to helm dashboard
        return router.createUrlTree(['/dashboard/helm']);
      }

      // If user is not authenticated, allow access to login route
      return true;
    })
  );
};
