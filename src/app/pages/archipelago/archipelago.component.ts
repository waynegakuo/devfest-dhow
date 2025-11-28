import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Voyage } from '../../models/voyage.model';
import { Island } from '../../models/island.model';
import { Deck, SessionType } from '../../models/venue.model';
import { VoyagesDataService } from '../../services/voyages-data/voyages-data.service';
import { MyVoyagePlanService } from '../../services/my-voyage-plan/my-voyage-plan.service';
import { VoyagePlanItem } from '../../models/voyage-plan.model';
import { SeoService } from '../../services/seo/seo.service';

@Component({
  selector: 'app-archipelago',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './archipelago.component.html',
  styleUrl: './archipelago.component.scss'
})
export class ArchipelagoComponent implements OnInit {
  private voyagesDataService = inject(VoyagesDataService);
  private myVoyagePlanService = inject(MyVoyagePlanService);
  private seoService = inject(SeoService);

  // Use centralized voyages data service
  voyages = this.voyagesDataService.voyages;

  ngOnInit() {
    this.seoService.setMetaTags({
      title: 'Archipelago of Sessions | DevFest Pwani 2025',
      description: 'Explore the full schedule of sessions, workshops, and talks at DevFest Pwani 2025. Discover the islands of knowledge and plan your voyage.',
      ogImageUrl: 'https://devfest-dhow.web.app/assets/logo/devfest-dhow-emblem.png'
    });
  }

  // Get all islands sorted by time
  getAllIslandsByTime(): Island[] {
    return this.voyagesDataService.getAllIslandsByTime();
  }

  // Hardcoded event date: November 29, 2025
  private getEventDate(time: string): Date {
    const [hours, minutes] = time.split(':');
    const eventDate = new Date('2025-11-29T00:00:00');
    eventDate.setHours(parseInt(hours), parseInt(minutes));
    return eventDate;
  }

  // Check if island session has completed (time has passed)
  isIslandComplete(island: Island): boolean {
    const now = new Date();
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
    const now = new Date();
    const sessionStartTime = this.getEventDate(island.time);

    // Parse duration to calculate session end time
    const durationMatch = island.duration.match(/(\d+)/);
    const durationMinutes = durationMatch ? parseInt(durationMatch[1]) : 0;

    const sessionEndTime = new Date(sessionStartTime);
    sessionEndTime.setMinutes(sessionEndTime.getMinutes() + durationMinutes);

    // Session is ongoing if current time is between start and end time
    return now.getTime() >= sessionStartTime.getTime() && now.getTime() <= sessionEndTime.getTime();
  }

    /**
     * Check if an island is already in the user's voyage plan
     */
    isInVoyagePlan(island: Island): boolean {
      return this.myVoyagePlanService.isInPlan(island.id);
    }

    /**
     * Add or remove an island from the user's voyage plan
     */
    toggleVoyagePlan(island: Island, voyage: any): void {
      const voyagePlanItem: VoyagePlanItem = {
        island,
        voyageId: voyage.id,
        voyageName: voyage.name,
        voyageDate: voyage.date
      };

      this.myVoyagePlanService.toggleSession(voyagePlanItem);
    }
}
