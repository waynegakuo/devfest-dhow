import { Injectable, signal, computed } from '@angular/core';
import { Voyage } from '../../models/voyage.model';
import { Island } from '../../models/island.model';
import { Deck, SessionType } from '../../models/venue.model';

// Interface for JSON data structure
interface VoyageJson {
  id: string;
  name: string;
  date: string;
  islands: IslandJson[];
}

interface IslandJson {
  id: string;
  title: string;
  speaker: string;
  speakerRole: string;
  speakerCompany: string;
  time: string;
  duration: string;
  venue: string;
  sessionType: string;
  description: string;
  tags: string[];
  attended: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class VoyagesDataService {

  // Signals for reactive data management
  private voyagesSignal = signal<Voyage[]>([]);
  private loadingSignal = signal(false);
  private errorSignal = signal<string | null>(null);

  // Public readonly signals
  readonly voyages = this.voyagesSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  // Computed signals for derived data
  readonly allIslands = computed(() => {
    const islands: Island[] = [];
    this.voyages().forEach(voyage => {
      islands.push(...voyage.islands);
    });
    return islands;
  });

  readonly islandsByTime = computed(() => {
    return this.allIslands().sort((a, b) => a.time.localeCompare(b.time));
  });

  constructor() {
    this.loadVoyagesData();
  }

  /**
   * Load voyages data from JSON file
   */
  private loadVoyagesData(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    // For now, import the JSON directly
    // In production, this would be an HTTP call
    import('../../data/mock-voyages.json')
      .then((data: any) => {
        const voyagesJson = data.default || data;
        const voyages = this.transformJsonToVoyages(voyagesJson);
        this.voyagesSignal.set(voyages);
        this.loadingSignal.set(false);
      })
      .catch((error) => {
        console.error('Error loading voyages data:', error);
        this.errorSignal.set('Failed to load voyages data');
        this.loadingSignal.set(false);
      });
  }

  /**
   * Transform JSON data to typed Voyage objects
   */
  private transformJsonToVoyages(voyagesJson: VoyageJson[]): Voyage[] {
    return voyagesJson.map(voyageJson => ({
      id: voyageJson.id,
      name: voyageJson.name,
      date: voyageJson.date,
      islands: voyageJson.islands.map(islandJson => this.transformJsonToIsland(islandJson))
    }));
  }

  /**
   * Transform JSON island data to typed Island object
   */
  private transformJsonToIsland(islandJson: IslandJson): Island {
    return {
      id: islandJson.id,
      title: islandJson.title,
      speaker: islandJson.speaker,
      speakerRole: islandJson.speakerRole,
      speakerCompany: islandJson.speakerCompany,
      time: islandJson.time,
      duration: islandJson.duration,
      venue: this.mapStringToDeck(islandJson.venue),
      sessionType: this.mapStringToSessionType(islandJson.sessionType),
      description: islandJson.description,
      tags: islandJson.tags,
      attended: islandJson.attended
    };
  }

  /**
   * Map string venue to Deck enum
   */
  private mapStringToDeck(venue: string): Deck {
    switch (venue) {
      case 'Alpha Deck': return Deck.ALPHA;
      case 'Bravo Deck': return Deck.BRAVO;
      case 'Charlie Deck': return Deck.CHARLIE;
      case 'Delta Deck': return Deck.DELTA;
      default: return Deck.ALPHA;
    }
  }

  /**
   * Map string session type to SessionType enum
   */
  private mapStringToSessionType(sessionType: string): SessionType {
    switch (sessionType) {
      case 'Opening Waters': return SessionType.OPENING_WATERS;
      case 'Breakout': return SessionType.BREAKOUT;
      case 'Lunch': return SessionType.LUNCH;
      case 'Group Photo': return SessionType.GROUP_PHOTO;
      case 'Closing Ceremony': return SessionType.CLOSING_CEREMONY;
      default: return SessionType.BREAKOUT;
    }
  }

  /**
   * Get voyage by ID
   */
  getVoyageById(id: string): Voyage | undefined {
    return this.voyages().find(voyage => voyage.id === id);
  }

  /**
   * Get island by ID
   */
  getIslandById(id: string): Island | undefined {
    return this.allIslands().find(island => island.id === id);
  }

  /**
   * Get voyages by session type
   */
  getVoyagesBySessionType(sessionType: SessionType): Voyage[] {
    return this.voyages().filter(voyage =>
      voyage.islands.some(island => island.sessionType === sessionType)
    );
  }

  /**
   * Get islands by session type
   */
  getIslandsBySessionType(sessionType: SessionType): Island[] {
    return this.allIslands().filter(island => island.sessionType === sessionType);
  }

  /**
   * Get islands by venue
   */
  getIslandsByVenue(venue: Deck): Island[] {
    return this.allIslands().filter(island => island.venue === venue);
  }

  /**
   * Mark island as attended
   */
  markIslandAsAttended(islandId: string, attended: boolean = true): void {
    const voyages = this.voyages().map(voyage => ({
      ...voyage,
      islands: voyage.islands.map(island =>
        island.id === islandId ? { ...island, attended } : island
      )
    }));
    this.voyagesSignal.set(voyages);
  }

  /**
   * Refresh data (useful for future Firebase integration)
   */
  refreshData(): void {
    this.loadVoyagesData();
  }

  /**
   * Get all islands sorted by time (utility method)
   */
  getAllIslandsByTime(): Island[] {
    return this.islandsByTime();
  }
}
