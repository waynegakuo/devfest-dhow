import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavigatorService } from '../../../services/navigator/navigator.service';
import { AdminService } from '../../../services/admin/admin.service';
import { VoyagesDataService } from '../../../services/voyages-data/voyages-data.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface AdminQuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
}

@Component({
  selector: 'app-admin-helm-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-helm-dashboard.component.html',
  styleUrl: './admin-helm-dashboard.component.scss'
})
export class AdminHelmDashboardComponent implements OnInit, OnDestroy {
  private navigatorService = inject(NavigatorService);
  private adminService = inject(AdminService);
  private voyagesDataService = inject(VoyagesDataService);
  private destroy$ = new Subject<void>();

  // Get navigator data
  readonly navigator = this.navigatorService.currentNavigator.asReadonly();

  // Admin statistics with real-time voyages and islands data
  private totalNavigatorCount = signal<number>(0);

  readonly adminStats = computed(() => ({
    totalVoyages: this.voyagesDataService.voyages().length,
    totalSessions: this.voyagesDataService.allIslands().length,
    totalNavigators: this.totalNavigatorCount(),
    activeRegistrations: this.totalNavigatorCount() // Use same count for registrations
  }));

  ngOnInit(): void {
    this.loadNavigatorCount();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load total navigator count from AdminService
   */
  private loadNavigatorCount(): void {
    this.adminService.getTotalNavigatorCount()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (count) => {
          this.totalNavigatorCount.set(count);
        },
        error: (error) => {
          console.error('Error loading navigator count:', error);
          this.totalNavigatorCount.set(0);
        }
      });
  }

  // Quick action cards for admin dashboard
  quickActions: AdminQuickAction[] = [
    {
      id: 'voyages',
      title: 'Fleet Management',
      description: 'Manage conference voyages and tracks',
      icon: '🚢',
      route: '/admin/voyages',
      color: 'ocean-blue'
    },
    {
      id: 'sessions',
      title: 'Island Coordination',
      description: 'Create and manage conference sessions',
      icon: '🏝️',
      route: '/admin/sessions',
      color: 'wave-teal'
    },
    {
      id: 'navigators',
      title: 'Navigator Registry',
      description: 'View and manage attendee information',
      icon: '🧭',
      route: '/admin/navigators',
      color: 'coral-orange'
    },
    {
      id: 'analytics',
      title: 'Fleet Analytics',
      description: 'View voyage and session insights',
      icon: '📊',
      route: '/admin/analytics',
      color: 'magenta-violet'
    },
    {
      id: 'settings',
      title: 'Ship Configuration',
      description: 'System settings and configuration',
      icon: '⚙️',
      route: '/admin/settings',
      color: 'deep-sea'
    },
    {
      id: 'roles',
      title: 'Admiral Command',
      description: 'Manage navigator roles and permissions',
      icon: '👑',
      route: '/admin/role-assignment',
      color: 'sand-beige'
    }
  ];

  // Welcome message based on time of day
  readonly welcomeMessage = computed(() => {
    const hour = new Date().getHours();
    const nav = this.navigator();
    const name = nav?.displayName || 'Admiral';

    if (hour < 12) {
      return `Good morning, ${name}! ☀️`;
    } else if (hour < 17) {
      return `Good afternoon, ${name}! ⛅`;
    } else {
      return `Good evening, ${name}! 🌙`;
    }
  });

  // Recent activity (placeholder for future implementation)
  readonly recentActivity = signal([
    {
      id: 1,
      action: 'Navigator registered',
      details: 'john.doe@example.com joined DevFest Dhow',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      type: 'registration'
    },
    {
      id: 2,
      action: 'Session updated',
      details: 'Angular Deep Dive session modified',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      type: 'session'
    },
    {
      id: 3,
      action: 'Voyage published',
      details: 'DevFest Dhow 2025 schedule published',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      type: 'voyage'
    }
  ]);

  // Format timestamp for display
  formatTimestamp(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  }
}
