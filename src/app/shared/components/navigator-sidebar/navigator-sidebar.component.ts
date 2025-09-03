import {Component, EventEmitter, Input, Output, signal, inject, OnDestroy, OnInit, computed} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { Island } from '../../../models/island.model';
import { Voyage } from '../../../models/voyage.model';
import { AuthService } from '../../../services/auth/auth.service';
import { AdminService } from '../../../services/admin/admin.service';
import { NavigatorService } from '../../../services/navigator/navigator.service';
import {Subject, takeUntil, filter} from 'rxjs';

export interface NavigationItem {
  id: string;
  name: string;
  icon: string;
  description: string;
  route?: string;
  action?: string;
}

export interface OceanTerm {
  name: string;
  icon: string;
  definition: string;
}

@Component({
  selector: 'app-navigator-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navigator-sidebar.component.html',
  styleUrl: './navigator-sidebar.component.scss'
})
export class NavigatorSidebarComponent implements OnInit, OnDestroy{
  private router = inject(Router);
  private authService = inject(AuthService);
  private adminService = inject(AdminService);
  private navigatorService = inject(NavigatorService);

  // Subject for managing subscriptions
  private destroy$ = new Subject<void>();

  // Input properties
  @Input() isOpen = false;
  @Input() voyages: Voyage[] = [];
  @Input() progress: { totalIslands: number; attendedIslands: number; completionRate: number } = {
    totalIslands: 0,
    attendedIslands: 0,
    completionRate: 0
  };
  @Input() customNavigationItems: NavigationItem[] | null = null;
  @Input() isAdminMode = false;

  // Output events
  @Output() sidebarClose = new EventEmitter<void>();
  @Output() navigationChange = new EventEmitter<string>();

  // Internal state
  private activeNavSignal = signal<string>('helm');
  readonly activeNav = this.activeNavSignal.asReadonly();

  // Terminology toggle state
  private showTerminologySignal = signal<boolean>(false);
  readonly showTerminology = this.showTerminologySignal.asReadonly();

  // Get current navigator data
  readonly navigator = this.navigatorService.currentNavigator.asReadonly();

  // Check if current user is admin
  readonly isAdmin = computed(() => {
    const nav = this.navigator();
    return nav?.role === 'admin';
  });

  // Get effective navigation items (custom or default)
  readonly effectiveNavigationItems = computed(() => {
    return this.customNavigationItems || this.navigationItems;
  });

  // Navigation items configuration
  navigationItems: NavigationItem[] = [
    { id: 'helm', name: 'The Helm', icon: '⚓', description: 'Dashboard - Central hub and key information', route: '/dashboard/helm' },
    { id: 'archipelago', name: 'The Archipelago', icon: '🏝️', description: 'Full Schedule - Complete conference schedule', route: '/dashboard/archipelago' },
    { id: 'voyage-plan', name: 'My Voyage Plan', icon: '🗺️', description: 'My Schedule - Your personalized sessions', route: '/dashboard/my-voyage-plan' },
    { id: 'galley', name: 'Stocking the Galley', icon: '📚', description: 'Preparatory Content - Curated learning resources for your track', route: '/dashboard/stocking-the-galley' },
    { id: 'drills', name: 'Navigational Drills', icon: '🎯', description: 'Challenges - Pre-conference challenges and quizzes', route: '/dashboard/navigational-drills' },
    { id: 'doubloons', name: 'Codelab Doubloons', icon: '🪙', description: 'Rewards - Gamification and codelab progress', route: '/dashboard/codelab-doubloons' },
    { id: 'oracle', name: 'Ask the Oracle', icon: '🔮', description: 'AI Assistant - Gemini-powered chatbot', route: '/dashboard/ask-the-oracle' },
    { id: 'atlantis', name: 'The Quest for Atlantis', icon: '🏛️', description: 'AR Hunt - Augmented reality scavenger hunt', route: '/dashboard/quest-for-atlantis' },
    { id: 'profile', name: 'My Profile', icon: '👤', description: 'Profile - View and edit your navigator profile', route: '/dashboard/my-profile' },
    { id: 'admin-roles', name: 'Admiral Command', icon: '👑', description: 'Admin - Manage navigator roles and permissions', route: '/dashboard/admin-role-assignment' },
    { id: 'logout', name: 'Log Out', icon: '🚪', description: 'Securely end your session', action: 'logout' }
  ];

  // Ocean terminology explanations
  oceanTerminology: OceanTerm[] = [
    { name: 'Navigator', icon: '🧭', definition: 'Conference attendee - that\'s you! The person exploring DevFest Dhow.' },
    { name: 'Voyage', icon: '⛵', definition: 'Conference track or theme - different learning paths through the event.' },
    { name: 'Island', icon: '🏝️', definition: 'Individual session or talk - specific presentations you can attend.' },
    { name: 'The Helm', icon: '⚓', definition: 'Dashboard - your central command center for managing your DevFest experience.' },
    { name: 'Archipelago', icon: '🗺️', definition: 'Full schedule - the complete map of all sessions across all tracks.' },
    { name: 'Voyage Plan', icon: '📋', definition: 'Your personal schedule - sessions you\'ve selected to attend.' },
    { name: 'Navigational Drills', icon: '🎯', definition: 'Pre-conference challenges and skill-building activities.' },
    { name: 'Doubloons', icon: '🪙', definition: 'Rewards and achievements earned through completing codelabs and challenges.' },
    { name: 'Oracle', icon: '🔮', definition: 'AI assistant powered by Gemini - your guide for DevFest questions.' },
    { name: 'Ports', icon: '🚢', definition: 'Venues and locations where sessions take place.' },
    { name: 'Cast Off', icon: '🌊', definition: 'Start your DevFest journey or begin a session.' },
    { name: 'Drop Anchor', icon: '⚓', definition: 'Save or bookmark something for later reference.' }
  ];

  ngOnInit(): void {
    // Set initial active navigation based on current route
    this.setActiveNavFromRoute(this.router.url);

    // Subscribe to route changes to update active navigation
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        this.setActiveNavFromRoute(event.url);
      });
  }

  // Helper method to determine active navigation item from route
  private setActiveNavFromRoute(url: string): void {
    const matchingItem = this.effectiveNavigationItems().find(item =>
      item.route && url.includes(item.route)
    );

    if (matchingItem) {
      this.activeNavSignal.set(matchingItem.id);
    }
  }

  // Close sidebar
  closeSidebar(): void {
    this.sidebarClose.emit();
  }

  // Toggle terminology section
  toggleTerminology(): void {
    this.showTerminologySignal.update(current => !current);
  }

  // Navigate to selected item
  navigateToItem(item: NavigationItem): void {
    if (item.action === 'logout') {
      this.logout();
    } else if (item.route) {
      this.activeNavSignal.set(item.id);
      this.router.navigate([item.route]);
      this.navigationChange.emit(item.id);
      // Don't auto-close sidebar to maintain state across navigation
    }
  }

  // Handle logout
  private logout(): void {
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

  // Get islands by time for chronological view
  getAllIslandsByTime(): Island[] {
    const allIslands: Island[] = [];
    this.voyages.forEach(voyage => {
      allIslands.push(...voyage.islands);
    });
    return allIslands.sort((a, b) => a.time.localeCompare(b.time));
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
