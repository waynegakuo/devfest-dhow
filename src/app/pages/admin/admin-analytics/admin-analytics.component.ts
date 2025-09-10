import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../../services/admin/admin.service';
import { Navigator } from '../../../models/navigator.model';
import { Voyage } from '../../../models/voyage.model';
import { Island } from '../../../models/island.model';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface FleetAnalytics {
  totalVoyages: number;
  totalIslands: number;
  totalNavigators: number;
  activeVoyages: number;
  completedVoyages: number;
  upcomingIslands: number;
  navigatorsByRole: { [key: string]: number };
  voyagesByStatus: { [key: string]: number };
  islandsByVoyage: { voyageName: string; islandCount: number }[];
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  action: string;
  type: 'voyage' | 'island' | 'navigator' | 'system';
  details: string;
  timestamp: Date;
}

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-analytics.component.html',
  styleUrl: './admin-analytics.component.scss'
})
export class AdminAnalyticsComponent implements OnInit, OnDestroy {
  private adminService = inject(AdminService);
  private destroy$ = new Subject<void>();

  // Analytics data signals
  fleetAnalytics = signal<FleetAnalytics>({
    totalVoyages: 0,
    totalIslands: 0,
    totalNavigators: 0,
    activeVoyages: 0,
    completedVoyages: 0,
    upcomingIslands: 0,
    navigatorsByRole: {},
    voyagesByStatus: {},
    islandsByVoyage: [],
    recentActivity: []
  });

  loading = signal<boolean>(true);
  lastUpdated = signal<Date>(new Date());

  // Computed analytics for display
  voyageCompletionRate = computed(() => {
    const analytics = this.fleetAnalytics();
    if (analytics.totalVoyages === 0) return 0;
    return Math.round((analytics.completedVoyages / analytics.totalVoyages) * 100);
  });

  averageIslandsPerVoyage = computed(() => {
    const analytics = this.fleetAnalytics();
    if (analytics.totalVoyages === 0) return 0;
    return Math.round((analytics.totalIslands / analytics.totalVoyages) * 10) / 10;
  });

  navigatorGrowthTrend = signal<'up' | 'down' | 'stable'>('stable');

  // Template helpers
  Math = Math;
  Object = Object;

  getMaxIslandCount(): number {
    const islandCounts = this.fleetAnalytics().islandsByVoyage.map(v => v.islandCount);
    return islandCounts.length > 0 ? Math.max(...islandCounts) : 1;
  }

  ngOnInit() {
    this.loadFleetAnalytics();

    // Refresh analytics every 5 minutes
    setInterval(() => {
      this.loadFleetAnalytics();
    }, 300000);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadFleetAnalytics(): void {
    this.loading.set(true);

    forkJoin({
      voyages: this.adminService.getAllVoyages(),
      navigators: this.adminService.getAllNavigators()
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: ({ voyages, navigators }) => {
        this.processAnalyticsData(voyages, navigators);
        this.loading.set(false);
        this.lastUpdated.set(new Date());
      },
      error: (error) => {
        console.error('Error loading fleet analytics:', error);
        this.loading.set(false);
      }
    });
  }

  private processAnalyticsData(voyages: Voyage[], navigators: Navigator[]): void {
    // Count islands across all voyages
    let totalIslands = 0;
    const islandsByVoyage: { voyageName: string; islandCount: number }[] = [];

    voyages.forEach(voyage => {
      const islandCount = voyage.islands?.length || 0;
      totalIslands += islandCount;
      islandsByVoyage.push({
        voyageName: voyage.name,
        islandCount: islandCount
      });
    });

    // Calculate voyage statistics (simplified since Voyage model doesn't have status)
    const activeVoyages = voyages.length; // All voyages are considered active
    const completedVoyages = 0; // No completed status available
    const upcomingIslands = totalIslands; // All islands are considered upcoming

    // Navigator role distribution
    const navigatorsByRole: { [key: string]: number } = {};
    navigators.forEach(navigator => {
      const role = navigator.role || 'navigator';
      navigatorsByRole[role] = (navigatorsByRole[role] || 0) + 1;
    });

    // Voyage status distribution (simplified - no status in Voyage model)
    const voyagesByStatus: { [key: string]: number } = {
      'active': voyages.length,
      'completed': 0,
      'upcoming': 0
    };

    // Generate recent activity (mock data for now)
    const recentActivity: ActivityItem[] = [
      {
        id: '1',
        action: 'New voyage created',
        type: 'voyage',
        details: `"${voyages[0]?.name || 'Advanced Voyage'}" was added to the fleet`,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        id: '2',
        action: 'Navigator registered',
        type: 'navigator',
        details: `${navigators.length} navigators now aboard the fleet`,
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
      },
      {
        id: '3',
        action: 'Island updated',
        type: 'island',
        details: 'Session details updated for upcoming islands',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
      }
    ];

    // Update analytics signal
    this.fleetAnalytics.set({
      totalVoyages: voyages.length,
      totalIslands: totalIslands,
      totalNavigators: navigators.length,
      activeVoyages: activeVoyages,
      completedVoyages: completedVoyages,
      upcomingIslands: upcomingIslands,
      navigatorsByRole: navigatorsByRole,
      voyagesByStatus: voyagesByStatus,
      islandsByVoyage: islandsByVoyage,
      recentActivity: recentActivity
    });
  }

  refreshAnalytics(): void {
    this.loadFleetAnalytics();
  }

  formatTimestamp(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  }

  exportAnalytics(): void {
    const analytics = this.fleetAnalytics();
    const dataStr = JSON.stringify(analytics, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `fleet-analytics-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }
}
