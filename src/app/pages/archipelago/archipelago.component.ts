import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Voyage } from '../../models/voyage.model';
import { Island } from '../../models/island.model';
import { Deck, SessionType } from '../../models/venue.model';
import { VoyagesDataService } from '../../services/voyages-data/voyages-data.service';

@Component({
  selector: 'app-archipelago',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './archipelago.component.html',
  styleUrl: './archipelago.component.scss'
})
export class ArchipelagoComponent {
  private voyagesDataService = inject(VoyagesDataService);

  // Use centralized voyages data service
  voyages = this.voyagesDataService.voyages;

  // Get all islands sorted by time
  getAllIslandsByTime(): Island[] {
    return this.voyagesDataService.getAllIslandsByTime();
  }

  // Check if island session has completed (time has passed)
  isIslandComplete(island: Island): boolean {
    const now = new Date();
    const sessionTime = new Date();
    const [hours, minutes] = island.time.split(':');
    sessionTime.setHours(parseInt(hours), parseInt(minutes));

    // Parse duration to add to session time (e.g., "40 min" -> 40)
    const durationMatch = island.duration.match(/(\d+)/);
    const durationMinutes = durationMatch ? parseInt(durationMatch[1]) : 0;

    // Add session duration to get end time
    sessionTime.setMinutes(sessionTime.getMinutes() + durationMinutes);

    // Session is complete if current time is past the session end time
    return now.getTime() > sessionTime.getTime();
  }
}
