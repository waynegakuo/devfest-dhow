import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-navigator-login',
  imports: [CommonModule],
  templateUrl: './navigator-login.component.html',
  styleUrl: './navigator-login.component.scss'
})
export class NavigatorLoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

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

    this.authService.signInWithGoogle().subscribe({
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
}
