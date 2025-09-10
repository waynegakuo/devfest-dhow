import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../services/admin/admin.service';
import { Navigator } from '../../../models/navigator.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-admin-navigator-management',
  imports: [CommonModule],
  templateUrl: './admin-navigator-management.component.html',
  styleUrl: './admin-navigator-management.component.scss'
})
export class AdminNavigatorManagementComponent implements OnInit, OnDestroy {
  private adminService = inject(AdminService);
  private destroy$ = new Subject<void>();

  // Signals for reactive state management
  readonly navigators = signal<Navigator[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly totalCount = signal<number>(0);
  readonly adminCount = signal<number>(0);
  readonly regularCount = signal<number>(0);

  ngOnInit(): void {
    this.loadNavigators();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load all navigators from the service
   */
  loadNavigators(): void {
    this.isLoading.set(true);

    this.adminService.getAllNavigators()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (navigators) => {
          this.navigators.set(navigators);
          this.updateCounts(navigators);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading navigators:', error);
          this.isLoading.set(false);
        }
      });
  }

  /**
   * Update count statistics based on loaded navigators
   */
  private updateCounts(navigators: Navigator[]): void {
    const total = navigators.length;
    const admins = navigators.filter(nav => nav.role === 'admin').length;
    const regular = total - admins;

    this.totalCount.set(total);
    this.adminCount.set(admins);
    this.regularCount.set(regular);
  }

  /**
   * Get display name for navigator
   */
  getDisplayName(navigator: Navigator): string {
    return navigator.displayName || navigator.email || 'Unknown Navigator';
  }

  /**
   * Get role badge class for styling
   */
  getRoleBadgeClass(role: string): string {
    return role === 'admin' ? 'role-badge admin' : 'role-badge navigator';
  }

  /**
   * Format date for display
   */
  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Get tech track display or fallback
   */
  getTechTrack(navigator: Navigator): string {
    return navigator.techTrack || 'Not selected';
  }

  /**
   * Get expertise level display or fallback
   */
  getExpertiseLevel(navigator: Navigator): string {
    return navigator.expertiseLevel || 'Not specified';
  }
}
