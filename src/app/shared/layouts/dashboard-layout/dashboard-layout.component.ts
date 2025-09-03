import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavigatorSidebarComponent } from '../../components/navigator-sidebar/navigator-sidebar.component';
import { AuthService } from '../../../services/auth/auth.service';
import { MyVoyagePlanService } from '../../../services/my-voyage-plan/my-voyage-plan.service';
import { Voyage } from '../../../models/voyage.model';
import { Deck, SessionType } from '../../../models/venue.model';
import {NavigatorService} from '../../../services/navigator/navigator.service';
import { VoyagesDataService } from '../../../services/voyages-data/voyages-data.service';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavigatorSidebarComponent],
  templateUrl: './dashboard-layout.component.html',
  styleUrl: './dashboard-layout.component.scss'
})
export class DashboardLayoutComponent {
  private authService = inject(AuthService);
  private myVoyageService = inject(MyVoyagePlanService);
  private navigatorService = inject(NavigatorService);
  private voyagesDataService = inject(VoyagesDataService);

  // Sidebar state management
  sidebarOpen = signal(false);

  // Get navigator data
  readonly navigator = this.navigatorService.getNavigator();

  // Use centralized voyages data service
  voyages = this.voyagesDataService.voyages;

  // Calculate progress from actual data
  readonly progress = signal({
    totalIslands: 11, // Updated to match actual island count
    attendedIslands: 0,
    completionRate: 0
  });

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
