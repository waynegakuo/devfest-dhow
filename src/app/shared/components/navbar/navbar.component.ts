import { Component, inject, HostListener, ElementRef } from '@angular/core';
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
  private elementRef = inject(ElementRef);

  isMobileMenuOpen = false;
  isUserDropdownOpen = false;

  // Expose auth service signals to the template
  isAuthenticated = this.authService.isAuthenticated;

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
   * Toggle user dropdown menu
   */
  toggleUserDropdown(): void {
    this.isUserDropdownOpen = !this.isUserDropdownOpen;
  }

  /**
   * Close user dropdown menu
   */
  closeUserDropdown(): void {
    this.isUserDropdownOpen = false;
  }

  /**
   * Close dropdown when clicking outside
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (this.isUserDropdownOpen && !this.elementRef.nativeElement.contains(event.target)) {
      this.closeUserDropdown();
    }
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
