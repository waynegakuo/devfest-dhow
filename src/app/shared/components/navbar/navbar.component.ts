import { Component, inject } from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  isMobileMenuOpen = false;

  // Expose auth service signals to template
  get isAuthenticated() {
    return this.authService.isAuthenticated;
  }

  get currentUser() {
    return this.authService.currentUser;
  }

  get userDisplayName() {
    return this.authService.getUserDisplayName();
  }

  get userPhotoUrl() {
    return this.authService.getUserPhotoUrl();
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  /**
   * Handle "Board the Ship" button click
   * Navigate to login if not authenticated
   */
  boardTheShip(): void {
    if (!this.isAuthenticated()) {
      this.router.navigate(['/login']);
    }
  }

  /**
   * Handle user sign out
   */
  signOut(): void {
    this.authService.signOut().subscribe({
      next: () => {
        console.log('Navigator successfully signed out');
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Sign-out error:', error);
      }
    });
  }
}
