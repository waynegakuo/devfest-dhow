import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import { Voyage } from '../../models/voyage.model';
import { Island } from '../../models/island.model';
import { Deck, SessionType } from '../../models/venue.model';
import {
  Firestore,
  collection,
  query,
  orderBy,
  getDocs,
  onSnapshot,
  CollectionReference
} from '@angular/fire/firestore';
import { from, Observable, forkJoin, of } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class VoyagesDataService implements OnDestroy {
  private firestore = inject(Firestore);
  private readonly voyagesCollection = collection(this.firestore, 'voyages') as CollectionReference;

  // Track unsubscribe functions for cleanup
  private unsubscribeFunctions: (() => void)[] = [];

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
   * Load voyages data from Firestore with real-time updates
   */
  private loadVoyagesData(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    // Set up real-time listener for voyages collection
    this.setupVoyagesRealTimeListener();
  }

  /**
   * Set up real-time listener for voyages collection
   */
  private setupVoyagesRealTimeListener(): void {
    const voyagesQuery = query(this.voyagesCollection, orderBy('date'));

    const unsubscribe = onSnapshot(voyagesQuery,
      (snapshot) => {
        this.processVoyagesSnapshot(snapshot);
      },
      (error) => {
        console.error('❌ Error in voyages real-time listener:', error);
        this.errorSignal.set('Failed to load voyages data');
        this.loadingSignal.set(false);
      }
    );

    // Store unsubscribe function for cleanup
    this.unsubscribeFunctions.push(unsubscribe);
  }

  /**
   * Process voyages snapshot and load islands with real-time listeners
   */
  private async processVoyagesSnapshot(snapshot: any): Promise<void> {
    const voyagePromises: Promise<Voyage>[] = [];

    snapshot.forEach((doc: any) => {
      const data = doc.data();
      const voyageId = doc.id;

      const voyagePromise = this.getVoyageWithRealTimeIslands(voyageId, data);
      voyagePromises.push(voyagePromise);
    });

    try {
      const voyages = await Promise.all(voyagePromises);
      this.voyagesSignal.set(voyages);
      this.loadingSignal.set(false);
    } catch (error) {
      console.error('❌ Error processing voyages snapshot:', error);
      this.errorSignal.set('Failed to process voyages data');
      this.loadingSignal.set(false);
    }
  }

  /**
   * Get voyage with real-time islands listener
   */
  private getVoyageWithRealTimeIslands(voyageId: string, voyageData: any): Promise<Voyage> {
    return new Promise((resolve, reject) => {
      const islandsRef = collection(this.firestore, `voyages/${voyageId}/islands`);

      const unsubscribe = onSnapshot(islandsRef,
        (snapshot) => {
          const islands: Island[] = [];
          snapshot.forEach(doc => {
            const data = doc.data() as any;
            islands.push({
              id: doc.id,
              title: data.title,
              speaker: data.speaker,
              speakerRole: data.speakerRole,
              speakerCompany: data.speakerCompany,
              time: data.time,
              duration: data.duration,
              venue: this.mapStringToDeck(data.venue),
              sessionType: this.mapStringToSessionType(data.sessionType),
              description: data.description,
              tags: data.tags || [],
              attended: data.attended || false
            });
          });

          const voyage: Voyage = {
            id: voyageId,
            name: voyageData.name,
            date: voyageData.date,
            islands: islands
          };

          resolve(voyage);

          // Update the existing voyage in the signal if it already exists
          const currentVoyages = this.voyagesSignal();
          const existingIndex = currentVoyages.findIndex(v => v.id === voyageId);

          if (existingIndex !== -1) {
            const updatedVoyages = [...currentVoyages];
            updatedVoyages[existingIndex] = voyage;
            this.voyagesSignal.set(updatedVoyages);
          }
        },
        (error) => {
          console.error(`❌ Error in islands real-time listener for voyage ${voyageId}:`, error);
          // Resolve with voyage containing empty islands on error
          resolve({
            id: voyageId,
            name: voyageData.name,
            date: voyageData.date,
            islands: []
          });
        }
      );

      // Store unsubscribe function for cleanup
      this.unsubscribeFunctions.push(unsubscribe);
    });
  }

  /**
   * Get all voyages from Firestore with their islands (legacy method - kept for compatibility)
   */
  private getAllVoyagesFromFirestore(): Observable<Voyage[]> {
    const voyagesQuery = query(this.voyagesCollection, orderBy('date'));

    return from(getDocs(voyagesQuery)).pipe(
      switchMap(snapshot => {
        const voyagePromises: Observable<Voyage>[] = [];

        snapshot.forEach(doc => {
          const data = doc.data() as any;
          const voyageId = doc.id;

          // Load islands for each voyage
          const islandsPromise = this.getIslandsByVoyage(voyageId).pipe(
            map(islands => ({
              id: voyageId,
              name: data.name,
              date: data.date,
              islands: islands
            } as Voyage)),
            catchError(error => {
              console.error(`❌ Error loading islands for voyage ${voyageId}:`, error);
              // Return voyage with empty islands array on error
              return of({
                id: voyageId,
                name: data.name,
                date: data.date,
                islands: []
              } as Voyage);
            })
          );

          voyagePromises.push(islandsPromise);
        });

        // Wait for all voyages with their islands to load
        return voyagePromises.length > 0 ? forkJoin(voyagePromises) : of([]);
      }),
      map(voyages => {
        return voyages;
      }),
      catchError(error => {
        console.error('❌ Error loading voyages from Firestore:', error);
        throw error;
      })
    );
  }

  /**
   * Get islands for a specific voyage from Firestore
   */
  private getIslandsByVoyage(voyageId: string): Observable<Island[]> {
    const voyageRef = collection(this.firestore, `voyages/${voyageId}/islands`);

    return from(getDocs(voyageRef)).pipe(
      map(snapshot => {
        const islands: Island[] = [];
        snapshot.forEach(doc => {
          const data = doc.data() as any;
          islands.push({
            id: doc.id,
            title: data.title,
            speaker: data.speaker,
            speakerRole: data.speakerRole,
            speakerCompany: data.speakerCompany,
            time: data.time,
            duration: data.duration,
            venue: this.mapStringToDeck(data.venue),
            sessionType: this.mapStringToSessionType(data.sessionType),
            description: data.description,
            tags: data.tags || [],
            attended: data.attended || false
          });
        });
        return islands;
      }),
      catchError(error => {
        console.error(`❌ Error loading islands for voyage ${voyageId}:`, error);
        return of([]);
      })
    );
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
      case 'Auditorium': return Deck.AUDITORIUM;
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

  /**
   * Cleanup method - unsubscribe from all real-time listeners
   */
  ngOnDestroy(): void {
    this.unsubscribeFunctions.forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    this.unsubscribeFunctions = [];
  }
}
