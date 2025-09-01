import { Component, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-navigator-login',
  imports: [CommonModule],
  templateUrl: './navigator-login.component.html',
  styleUrl: './navigator-login.component.scss'
})
export class NavigatorLoginComponent implements OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Subject for managing subscriptions
  private destroy$ = new Subject<void>();

  // Loading state for sign-in process
  isSigningIn = signal<boolean>(false);

  // Error message signal
  errorMessage = signal<string | null>(null);

  constructor() {
    // Check if user is already authenticated
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/helm']); // Navigate to dashboard
    }
  }

  /**
   * Handle Google sign-in
   */
  signInWithGoogle(): void {
    this.isSigningIn.set(true);
    this.errorMessage.set(null);

    this.authService.signInWithGoogle()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          console.log('Navigator successfully signed in:', user);
          this.isSigningIn.set(false);
          this.router.navigate(['/helm']); // Navigate to dashboard after successful login
        },
        error: (error) => {
          console.error('Sign-in error:', error);
          this.isSigningIn.set(false);
          this.errorMessage.set('Failed to sign in. Please try again.');
        }
      });
  }

  /**
   * Lifecycle hook that is called when the component is destroyed
   * Completes the destroy$ Subject to unsubscribe from all subscriptions
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
