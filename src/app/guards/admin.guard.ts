import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { NavigatorService } from '../services/navigator/navigator.service';
import { AuthService } from '../services/auth/auth.service';

/**
 * Guard that protects admin-specific routes from non-admin access
 * If user is not an admin, redirect them to the main dashboard
 * Checks both authentication and admin role status
 */
export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const navigatorService = inject(NavigatorService);

  // First check if user is authenticated
  const currentUser = authService.currentUser();
  if (!currentUser) {
    // If user is not authenticated, redirect to login page
    router.navigate(['/login']);
    return false;
  }

  // If authenticated, check if user has admin role
  return navigatorService.getNavigator().pipe(
    map(navigator => {
      if (!navigator || navigator.role !== 'admin') {
        // If user is not an admin, redirect to main dashboard
        router.navigate(['/dashboard/helm']);
        return false;
      }

      // If user is an admin, allow access to admin routes
      return true;
    })
  );
};
