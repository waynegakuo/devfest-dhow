import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { NavigatorService } from '../services/navigator.service';
import { map, switchMap, of } from 'rxjs';

/**
 * Guard that ensures users complete course selection before accessing protected routes
 * If user is authenticated but hasn't completed course selection, redirect to chart-course
 */
export const courseSelectionGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const navigatorService = inject(NavigatorService);
  const router = inject(Router);

  // If user is not authenticated, redirect to login page
  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  // Check if user has completed course selection
  return navigatorService.getNavigator().pipe(
    map(navigator => {
      if (!navigator) {
        // If navigator data doesn't exist, redirect to course selection
        router.navigate(['/chart-course']);
        return false;
      }

      if (!navigator.hasCompletedCourseSelection) {
        // If course selection is not completed, redirect to chart-course
        router.navigate(['/chart-course']);
        return false;
      }

      // User is authenticated and has completed course selection
      return true;
    })
  );
};
