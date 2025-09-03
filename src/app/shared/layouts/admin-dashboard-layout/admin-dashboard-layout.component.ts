import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavigatorSidebarComponent } from '../../components/navigator-sidebar/navigator-sidebar.component';
import { AuthService } from '../../../services/auth/auth.service';
import { NavigatorService } from '../../../services/navigator/navigator.service';
import { NavigationItem } from '../../components/navigator-sidebar/navigator-sidebar.component';

@Component({
  selector: 'app-admin-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavigatorSidebarComponent],
  templateUrl: './admin-dashboard-layout.component.html',
  styleUrl: './admin-dashboard-layout.component.scss'
})
export class AdminDashboardLayoutComponent {
  private authService = inject(AuthService);
  private navigatorService = inject(NavigatorService);

  // Sidebar state management
  sidebarOpen = signal(false);

  // Get navigator data
  readonly navigator = this.navigatorService.getNavigator();

  // Admin-specific navigation items
  adminNavigationItems: NavigationItem[] = [
    { id: 'admin-helm', name: 'Admiral\'s Helm', icon: '⚓', description: 'Admin Dashboard - Central command for voyage management', route: '/admin/helm' },
    { id: 'voyage-management', name: 'Fleet Management', icon: '🚢', description: 'Voyage Management - Create, edit and manage voyages', route: '/admin/voyages' },
    { id: 'session-management', name: 'Island Coordination', icon: '🏝️', description: 'Session Management - Manage conference sessions', route: '/admin/sessions' },
    { id: 'navigator-management', name: 'Navigator Registry', icon: '🧭', description: 'Navigator Management - View and manage attendees', route: '/admin/navigators' },
    { id: 'analytics', name: 'Fleet Analytics', icon: '📊', description: 'Analytics - Voyage and session insights', route: '/admin/analytics' },
    { id: 'settings', name: 'Ship Configuration', icon: '⚙️', description: 'Settings - System configuration and preferences', route: '/admin/settings' },
    { id: 'back-to-dashboard', name: 'Return to Voyage', icon: '🔙', description: 'Back to Main Dashboard', route: '/dashboard/helm' },
    { id: 'logout', name: 'Log Out', icon: '🚪', description: 'Securely end your session', action: 'logout' }
  ];

  // Toggle sidebar
  toggleSidebar(): void {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  // Close sidebar
  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  // Handle navigation changes from sidebar
  handleNavigationChange(navigationId: string): void {
    // Handle any specific navigation logic if needed
    // Don't auto-close sidebar to maintain state across navigation
  }
}
