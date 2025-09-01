import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavigatorSidebarComponent } from '../../components/navigator-sidebar/navigator-sidebar.component';
import { AuthService } from '../../../services/auth/auth.service';
import { MyVoyagePlanService } from '../../../services/my-voyage-plan/my-voyage-plan.service';
import { Voyage } from '../../../models/voyage.model';
import {NavigatorService} from '../../../services/navigator/navigator.service';

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

  // Sidebar state management
  sidebarOpen = signal(false);

  // Get navigator data
  readonly navigator = this.navigatorService.getNavigator();

  // Mock voyages data - in real app this would come from a service
  voyages = signal<Voyage[]>([
    {
      id: 'voyage-1',
      name: 'Opening Waters',
      date: '2025-02-15',
      islands: [
        {
          id: 'island-1',
          title: 'Welcome Aboard - DevFest Dhow Opening',
          speaker: 'Captain Sarah Johnson',
          speakerRole: 'Lead Developer Advocate',
          speakerCompany: 'Google',
          time: '09:00',
          duration: '30 min',
          venue: 'Main Deck',
          description: 'Join us as we set sail on an incredible journey through the latest in tech and development.',
          tags: ['Opening', 'Welcome', 'Community'],
          attended: false
        }
      ]
    }
  ]);

  // Calculate progress
  readonly progress = signal({
    totalIslands: 10,
    attendedIslands: 3,
    completionRate: 30
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
