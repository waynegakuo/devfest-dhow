import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MyVoyagePlanService } from '../../services/my-voyage-plan/my-voyage-plan.service';
import { VoyagePlanItem } from '../../models/voyage-plan.model';

@Component({
  selector: 'app-my-voyage-plan',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-voyage-plan.component.html',
  styleUrl: './my-voyage-plan.component.scss'
})
export class MyVoyagePlanComponent {
  private myVoyageService = inject(MyVoyagePlanService);
  private router = inject(Router);

  // Get sorted voyage plan items from service
  readonly myVoyagePlan = this.myVoyageService.itemsSorted;
  readonly totalSessions = this.myVoyageService.items;

  // Remove session from voyage plan
  removeFromPlan(islandId: string): void {
    this.myVoyageService.removeSession(islandId);
  }

  // Clear entire voyage plan
  clearVoyagePlan(): void {
    if (confirm('Are you sure you want to clear your entire voyage plan? This action cannot be undone.')) {
      this.myVoyageService.clear();
    }
  }

  // Format date for display
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Format time for display
  formatTime(timeString: string): string {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  // Check if session is upcoming
  isUpcoming(item: VoyagePlanItem): boolean {
    const now = new Date();
    const sessionDateTime = new Date(`${item.voyageDate}T${item.island.time}`);
    return sessionDateTime > now;
  }

  // Navigate to archipelago using proper Angular routing
  navigateToArchipelago(): void {
    this.router.navigate(['/dashboard/archipelago']);
  }
}
