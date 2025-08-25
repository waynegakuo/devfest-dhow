import {Component, inject, HostListener, ElementRef, Output, EventEmitter, OnDestroy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';
import {Subject, takeUntil} from 'rxjs';

@Component({
  selector: 'app-user-auth',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-auth.component.html',
  styleUrl: './user-auth.component.scss'
})
export class UserAuthComponent implements OnDestroy{
  private authService = inject(AuthService);
  private router = inject(Router);
  private elementRef = inject(ElementRef);

  @Output() closeMobileMenu = new EventEmitter<void>();

  isUserDropdownOpen = false;
  // Subject for managing subscriptions
  private destroy$ = new Subject<void>();

  // Expose auth service signals to the template
  isAuthenticated = this.authService.isAuthenticated;
  isAuthLoading = this.authService.isLoading;

  get currentUser() {
    return this.authService.currentUser;
  }

  get userDisplayName() {
    return this.authService.getUserDisplayName();
  }

  get userPhotoUrl() {
    return this.authService.getUserPhotoUrl();
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
    this.authService.signOut()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
      next: () => {
        console.log('Navigator successfully signed out');
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Sign-out error:', error);
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
