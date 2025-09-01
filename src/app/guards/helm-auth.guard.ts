import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { first, map } from 'rxjs';
import { Auth, authState } from '@angular/fire/auth';

/**
 * Guard that protects the helm dashboard route from unauthenticated access
 * If user is not logged in and tries to access helm, redirect them to login
 * Uses AngularFire's authState observable to wait for Firebase auth initialization
 */
export const helmAuthGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const auth = inject(Auth);

  // Use AngularFire's authState observable to check authentication
  return authState(auth).pipe(
    first(), // Take only the first emission to avoid multiple checks
    map(user => {
      if (!user) {
        // If user is not authenticated, redirect to login page
        router.navigate(['/login']);
        return false;
      }

      // If user is authenticated, allow access to helm route
      return true;
    })
  );
};
