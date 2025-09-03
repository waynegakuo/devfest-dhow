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
}
