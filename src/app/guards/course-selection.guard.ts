import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { NavigatorService } from '../services/navigator/navigator.service';
import { first, map, switchMap, of } from 'rxjs';
import { Auth, authState } from '@angular/fire/auth';

/**
 * Guard that ensures users complete course selection before accessing protected routes
 * If user is authenticated but hasn't completed course selection, redirect to chart-course
 * Uses AngularFire's authState observable to wait for Firebase auth initialization
 */
export const courseSelectionGuard: CanActivateFn = (route, state) => {
  const navigatorService = inject(NavigatorService);
  const router = inject(Router);
  const auth = inject(Auth);

  // Use AngularFire's authState observable to check authentication and course selection
  return authState(auth).pipe(
    first(), // Take only the first emission to avoid multiple checks
    switchMap(user => {
      if (!user) {
        // If user is not authenticated, redirect to login page
        router.navigate(['/login']);
        return of(false);
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
    })
  );
};
