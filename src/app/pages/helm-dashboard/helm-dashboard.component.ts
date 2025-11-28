import { Component, signal, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Island } from '../../models/island.model';
import { Voyage } from '../../models/voyage.model';
import { Deck, SessionType } from '../../models/venue.model';
import { AuthService } from '../../services/auth/auth.service';
import { MyVoyagePlanService } from '../../services/my-voyage-plan/my-voyage-plan.service';
import { VoyagePlanItem } from '../../models/voyage-plan.model';
import { VoyagesDataService } from '../../services/voyages-data/voyages-data.service';
import { SeoService } from '../../services/seo/seo.service';
import { AnalyticsService } from '../../services/analytics/analytics.service';

@Component({
  selector: 'app-helm-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './helm-dashboard.component.html',
  styleUrl: './helm-dashboard.component.scss'
})
export class HelmDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private myVoyage = inject(MyVoyagePlanService);
  private voyagesDataService = inject(VoyagesDataService);
  private seoService = inject(SeoService);
  private analyticsService = inject(AnalyticsService);

  // Use centralized voyages data service
  readonly voyages = this.voyagesDataService.voyages;

  // Navigator's progress tracking - computed from actual voyage data
  readonly progress = computed(() => {
    const voyages = this.voyages();
    const totalIslands = voyages.reduce((total: number, voyage: Voyage) => total + voyage.islands.length, 0);
    const attendedIslands = voyages.reduce((total: number, voyage: Voyage) =>
      total + voyage.islands.filter((island: Island) => island.attended).length, 0);
    const completionRate = totalIslands > 0 ? Math.round((attendedIslands / totalIslands) * 100) : 0;

    return {
      totalIslands,
      attendedIslands,
      completionRate
    };
  });

  // Current navigator info from logged-in user
  navigator = computed(() => {
    const user = this.authService.currentUser();
    if (!user) {
      return {
        name: 'Guest Navigator',
        email: 'guest@devfest.com',
        registrationNumber: 'DHW2025-GUEST',
        voyageLevel: 'Explorer'
      };
    }

    // Generate registration number from user ID
    const registrationNumber = `DHW2025-${user.uid.slice(-3).toUpperCase()}`;

    // Determine voyage level based on user activity (can be enhanced later)
    const voyageLevel = 'Captain';

    return {
      name: user.displayName || 'Anonymous Navigator',
      email: user.email || 'navigator@devfest.com',
      registrationNumber,
      voyageLevel
    };
  });

  ngOnInit() {
    this.seoService.setMetaTags({
      title: 'Helm Dashboard | DevFest Pwani 2025',
      description: 'Your personal dashboard for DevFest Pwani 2025. Track your progress, view your schedule, and manage your voyage plan.',
      ogImageUrl: 'https://devfest-dhow.web.app/assets/logo/devfest-dhow-emblem.png'
    });
  }


  // Toggle island attendance
  toggleAttendance(voyageId: string, islandId: string): void {
    const island = this.voyagesDataService.getIslandById(islandId);
    if (island) {
      this.analyticsService.logEvent('toggle_attendance', {
        island_id: islandId,
        attended: !island.attended
      });
      this.voyagesDataService.markIslandAsAttended(islandId, !island.attended);
    }
  }


  // Get islands by time for chronological view
  getAllIslandsByTime(): Island[] {
    const allIslands: Island[] = [];
    this.voyages().forEach(voyage => {
      allIslands.push(...voyage.islands);
    });
    return allIslands.sort((a, b) => a.time.localeCompare(b.time));
  }

  // My Voyage Plan helpers
  isInMyVoyage(islandId: string): boolean {
    return this.myVoyage.isInPlan(islandId);
  }

  toggleMyVoyage(voyage: Voyage, island: Island): void {
    const item: VoyagePlanItem = {
      island,
      voyageId: voyage.id,
      voyageName: voyage.name,
      voyageDate: voyage.date
    };
    const isInPlan = this.isInMyVoyage(island.id);
    this.analyticsService.logEvent(isInPlan ? 'remove_from_voyage_plan' : 'add_to_voyage_plan', {
      island_id: island.id,
      island_title: island.title,
      voyage_id: voyage.id,
      voyage_name: voyage.name
    });
    this.myVoyage.toggleSession(item);
  }

  toggleMyVoyageByIsland(island: Island): void {
    const v = this.voyages().find(vg => vg.islands.some(i => i.id === island.id));
    if (!v) return;
    this.toggleMyVoyage(v, island);
  }

  myVoyagePlanSorted() {
    return this.myVoyage.itemsSorted();
  }

  // Hardcoded event date: November 29, 2025
  private getEventDate(time: string): Date {
    const [hours, minutes] = time.split(':');
    const eventDate = new Date('2025-11-29T00:00:00');
    eventDate.setHours(parseInt(hours), parseInt(minutes));
    return eventDate;
  }

  // Check if island is happening now or soon
  isIslandUpcoming(island: Island): boolean {
    // For demo purposes, consider sessions in the next 2 hours as upcoming
    const now = new Date(); // This will be compared against the hardcoded event date
    const sessionTime = this.getEventDate(island.time);

    const timeDiff = sessionTime.getTime() - now.getTime();
    return timeDiff > 0 && timeDiff <= 2 * 60 * 60 * 1000; // 2 hours in milliseconds
  }

  // Check if island session has completed (time has passed)
  isIslandComplete(island: Island): boolean {
    const now = new Date(); // This will be compared against the hardcoded event date
    const sessionTime = this.getEventDate(island.time);

    // Parse duration to add to session time (e.g., "40 min" -> 40)
    const durationMatch = island.duration.match(/(\d+)/);
    const durationMinutes = durationMatch ? parseInt(durationMatch[1]) : 0;

    // Add session duration to get end time
    sessionTime.setMinutes(sessionTime.getMinutes() + durationMinutes);

    // Session is complete if current time is past the session end time
    return now.getTime() > sessionTime.getTime();
  }

  // Check if island session is currently ongoing
  isIslandOngoing(island: Island): boolean {
    const now = new Date(); // This will be compared against the hardcoded event date
    const sessionStartTime = this.getEventDate(island.time);

    // Parse duration to calculate session end time
    const durationMatch = island.duration.match(/(\d+)/);
    const durationMinutes = durationMatch ? parseInt(durationMatch[1]) : 0;

    const sessionEndTime = new Date(sessionStartTime);
    sessionEndTime.setMinutes(sessionEndTime.getMinutes() + durationMinutes);

    // Session is ongoing if current time is between start and end time
    return now.getTime() >= sessionStartTime.getTime() && now.getTime() <= sessionEndTime.getTime();
  }

  // Get voyage ID for a given island ID
  getVoyageForIsland(islandId: string): string {
    const voyage = this.voyages().find(voyage =>
      voyage.islands.some(island => island.id === islandId)
    );
    return voyage?.id || '';
  }

  // Get count of attended islands for a voyage
  getAttendedCount(voyage: Voyage): number {
    return voyage.islands.filter(island => island.attended).length;
  }

}
