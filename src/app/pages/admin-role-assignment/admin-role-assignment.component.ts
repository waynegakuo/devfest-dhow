import {Component, inject, OnDestroy, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin/admin.service';
import { AuthService } from '../../services/auth/auth.service';
import { Navigator } from '../../models/navigator.model';
import {Subject, takeUntil} from 'rxjs';

@Component({
  selector: 'app-admin-role-assignment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-role-assignment.component.html',
  styleUrl: './admin-role-assignment.component.scss'
})
export class AdminRoleAssignmentComponent implements OnDestroy{
  private adminService = inject(AdminService);
  private authService = inject(AuthService);

  // Form state
  emailToAssign = signal<string>('');
  emailToRemove = signal<string>('');

  // UI state
  isAssigning = this.adminService.assigningRole;
  lastResult = this.adminService.lastOperationResult;

  // Admin navigators list
  adminNavigators = signal<Navigator[]>([]);
  loadingAdmins = signal<boolean>(false);

  // Current user info
  currentUser = this.authService.currentUser;

  destroy$ = new Subject<void>();

  constructor() {
    // Load admin navigators on component init
    this.loadAdminNavigators();
  }

  /**
   * Assigns admin role to the specified email
   */
  assignAdminRole(): void {
    const email = this.emailToAssign().trim();

    if (!email) {
      this.adminService.lastOperationResult.set({
        success: false,
        message: 'Please enter a valid email address.'
      });
      return;
    }

    if (!this.isValidEmail(email)) {
      this.adminService.lastOperationResult.set({
        success: false,
        message: 'Please enter a valid email format.'
      });
      return;
    }

    this.adminService.assignAdminRole(email)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.success) {
            this.emailToAssign.set('');
            this.loadAdminNavigators(); // Refresh the admin list
          }
        },
        error: (error) => {
          console.error('Error assigning admin role:', error);
        }
      });
  }

  /**
   * Removes admin role from the specified email
   */
  removeAdminRole(): void {
    const email = this.emailToRemove().trim();

    if (!email) {
      this.adminService.lastOperationResult.set({
        success: false,
        message: 'Please enter a valid email address.'
      });
      return;
    }

    if (!this.isValidEmail(email)) {
      this.adminService.lastOperationResult.set({
        success: false,
        message: 'Please enter a valid email format.'
      });
      return;
    }

    // Prevent removing own admin role
    const currentUserEmail = this.currentUser()?.email;
    if (currentUserEmail === email) {
      this.adminService.lastOperationResult.set({
        success: false,
        message: 'You cannot remove your own admin role.'
      });
      return;
    }

    this.adminService.removeAdminRole(email)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.success) {
            this.emailToRemove.set('');
            this.loadAdminNavigators(); // Refresh the admin list
          }
        },
        error: (error) => {
          console.error('Error removing admin role:', error);
        }
      });
  }

  /**
   * Loads the list of admin navigators
   */
  private loadAdminNavigators(): void {
    this.loadingAdmins.set(true);

    this.adminService.getAdminNavigators()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (admins) => {
          this.adminNavigators.set(admins);
          this.loadingAdmins.set(false);
        },
        error: (error) => {
          console.error('Error loading admin navigators:', error);
          this.loadingAdmins.set(false);
        }
      });
  }

  /**
   * Removes admin role directly from the admin list
   */
  removeAdminFromList(adminEmail: string): void {
    // Prevent removing own admin role
    const currentUserEmail = this.currentUser()?.email;
    if (currentUserEmail === adminEmail) {
      this.adminService.lastOperationResult.set({
        success: false,
        message: 'You cannot remove your own admin role.'
      });
      return;
    }

    this.adminService.removeAdminRole(adminEmail)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.success) {
            this.loadAdminNavigators(); // Refresh the admin list
          }
        },
        error: (error) => {
          console.error('Error removing admin role:', error);
        }
      });
  }

  /**
   * Validates email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Clears the last operation result
   */
  clearResult(): void {
    this.adminService.lastOperationResult.set(null);
  }

  /**
   * Updates the assign email input
   */
  updateAssignEmail(event: Event): void {
    if(event.target){
      const email = (event.target as HTMLInputElement).value;
      this.emailToAssign.set(email);
    }
  }

  /**
   * Updates the remove email input
   */
  updateRemoveEmail(event: Event): void {
    if(event.target){
      const email = (event.target as HTMLInputElement).value;
      this.emailToRemove.set(email);
    }
  }

  /**
   * Refreshes the admin list
   */
  refreshAdminList(): void {
    this.loadAdminNavigators();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
