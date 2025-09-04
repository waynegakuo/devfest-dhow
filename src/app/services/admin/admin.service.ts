import {Injectable, inject, signal, runInInjectionContext, EnvironmentInjector} from '@angular/core';
import {
  Firestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  addDoc,
  setDoc,
  deleteDoc,
  writeBatch,
  orderBy,
  CollectionReference,
  DocumentReference
} from '@angular/fire/firestore';
import { Navigator, NavigatorRole } from '../../models/navigator.model';
import { Voyage } from '../../models/voyage.model';
import { Island } from '../../models/island.model';
import { Deck, SessionType } from '../../models/venue.model';
import { from, Observable, throwError, of, forkJoin } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private environmentInjector = inject(EnvironmentInjector);

  private firestore = inject(Firestore);

  // Collection references
  private readonly voyagesCollection = collection(this.firestore, 'voyages');

  // Signal to track loading state
  assigningRole = signal<boolean>(false);

  // Signal to track the last operation result
  lastOperationResult = signal<{ success: boolean; message: string } | null>(null);

  /**
   * VOYAGE CRUD OPERATIONS
   */

  /**
   * Create a new voyage in Firestore
   * @param voyage Voyage data (without ID, will be auto-generated)
   * @returns Observable<string> The created voyage ID
   */
  createVoyage(voyage: Omit<Voyage, 'id'>): Observable<string> {
    try {
      const voyageData = {
        name: voyage.name,
        date: voyage.date
      };

      const voyagePromise = addDoc(this.voyagesCollection, voyageData);

      return from(voyagePromise).pipe(
        map(docRef => {
          console.log('🚢 Voyage created with ID:', docRef.id);
          return docRef.id;
        }),
        catchError(error => {
          console.error('❌ Error creating voyage:', error);
          return throwError(() => new Error('Failed to create voyage: ' + error.message));
        })
      );
    } catch (error: any) {
      return throwError(() => new Error('Failed to create voyage: ' + error.message));
    }
  }

  /**
   * Get all voyages from Firestore with their islands
   * @returns Observable<Voyage[]> Array of all voyages with islands loaded
   */
  getAllVoyages(): Observable<Voyage[]> {
    try {
      return runInInjectionContext(this.environmentInjector, () => {
        const voyagesQuery = query(this.voyagesCollection, orderBy('date'));

        const voyagesPromise = getDocs(voyagesQuery);

        return from(voyagesPromise).pipe(
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

            // Wait for all voyages with their islands to load using forkJoin
            return voyagePromises.length > 0 ? forkJoin(voyagePromises) : of([]);
          }),
          map(voyages => {
            console.log('🌊 Loaded voyages with islands:', voyages.length);
            return voyages;
          }),
          catchError(error => {
            console.error('❌ Error loading voyages:', error);
            return throwError(() => new Error('Failed to load voyages: ' + error.message));
          })
        );
      })

    } catch (error: any) {
      return throwError(() => new Error('Failed to load voyages: ' + error.message));
    }
  }

  /**
   * Get a specific voyage by ID
   * @param voyageId The voyage ID
   * @returns Observable<Voyage | null> The voyage or null if not found
   */
  getVoyageById(voyageId: string): Observable<Voyage | null> {
    try {
      const voyageRef = doc(this.voyagesCollection, voyageId);
      const voyagePromise = getDoc(voyageRef);

      return from(voyagePromise).pipe(
        map(docSnap => {
          if (docSnap.exists()) {
            const data = docSnap.data() as any;
            return {
              id: docSnap.id,
              name: data.name,
              date: data.date,
              islands: [] // Islands loaded separately
            } as Voyage;
          }
          return null;
        }),
        catchError(error => {
          console.error('❌ Error loading voyage:', error);
          return throwError(() => new Error('Failed to load voyage: ' + error.message));
        })
      );
    } catch (error: any) {
      return throwError(() => new Error('Failed to load voyage: ' + error.message));
    }
  }

  /**
   * Update an existing voyage
   * @param voyageId The voyage ID to update
   * @param updates Partial voyage data to update
   * @returns Observable<void>
   */
  updateVoyage(voyageId: string, updates: Partial<Omit<Voyage, 'id' | 'islands'>>): Observable<void> {
    try {
      const voyageRef = doc(this.voyagesCollection, voyageId);
      const updatePromise = updateDoc(voyageRef, updates);

      return from(updatePromise).pipe(
        map(() => {
          console.log('✅ Voyage updated:', voyageId);
        }),
        catchError(error => {
          console.error('❌ Error updating voyage:', error);
          return throwError(() => new Error('Failed to update voyage: ' + error.message));
        })
      );
    } catch (error: any) {
      return throwError(() => new Error('Failed to update voyage: ' + error.message));
    }
  }

  /**
   * Delete a voyage and all its islands
   * @param voyageId The voyage ID to delete
   * @returns Observable<void>
   */
  deleteVoyage(voyageId: string): Observable<void> {
    try {
      const voyageRef = doc(this.voyagesCollection, voyageId);
      const islandsCollection = collection(voyageRef, 'islands');

      return from(this.deleteVoyageWithIslands(voyageRef, islandsCollection)).pipe(
        map(() => {
          console.log('🗑️ Voyage and islands deleted:', voyageId);
        }),
        catchError(error => {
          console.error('❌ Error deleting voyage:', error);
          return throwError(() => new Error('Failed to delete voyage: ' + error.message));
        })
      );
    } catch (error: any) {
      return throwError(() => new Error('Failed to delete voyage: ' + error.message));
    }
  }

  /**
   * Helper method to delete voyage with all its islands using batch
   */
  private async deleteVoyageWithIslands(voyageRef: DocumentReference, islandsCollection: CollectionReference): Promise<void> {
    const batch = writeBatch(this.firestore);

    // Get all islands first
    const islandsSnapshot = await getDocs(islandsCollection);

    // Add all island deletions to batch
    islandsSnapshot.forEach(islandDoc => {
      batch.delete(islandDoc.ref);
    });

    // Add voyage deletion to batch
    batch.delete(voyageRef);

    // Commit all deletions
    await batch.commit();
  }

  /**
   * ISLAND CRUD OPERATIONS
   */

  /**
   * Create a new island in a voyage
   * @param voyageId The voyage ID to add the island to
   * @param island Island data (without ID, will be auto-generated)
   * @returns Observable<string> The created island ID
   */
  createIsland(voyageId: string, island: Omit<Island, 'id'>): Observable<string> {
    try {
      const voyageRef = doc(this.voyagesCollection, voyageId);
      const islandsCollection = collection(voyageRef, 'islands');

      const islandData = {
        title: island.title,
        speaker: island.speaker,
        speakerRole: island.speakerRole,
        speakerCompany: island.speakerCompany,
        time: island.time,
        duration: island.duration,
        venue: island.venue,
        sessionType: island.sessionType,
        description: island.description,
        tags: island.tags,
        attended: island.attended
      };

      const islandPromise = addDoc(islandsCollection, islandData);

      return from(islandPromise).pipe(
        map(docRef => {
          console.log('🏝️ Island created with ID:', docRef.id);
          return docRef.id;
        }),
        catchError(error => {
          console.error('❌ Error creating island:', error);
          return throwError(() => new Error('Failed to create island: ' + error.message));
        })
      );
    } catch (error: any) {
      return throwError(() => new Error('Failed to create island: ' + error.message));
    }
  }

  /**
   * Get all islands for a specific voyage
   * @param voyageId The voyage ID
   * @returns Observable<Island[]> Array of islands in the voyage
   */
  getIslandsByVoyage(voyageId: string): Observable<Island[]> {
    try {
      return runInInjectionContext(this.environmentInjector, () => {
        const voyageRef = doc(this.voyagesCollection, voyageId);
        const islandsCollection = collection(voyageRef, 'islands');
        const islandsQuery = query(islandsCollection, orderBy('time'));
        const islandsPromise = getDocs(islandsQuery);

        return from(islandsPromise).pipe(
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
            console.log('🏝️ Loaded islands for voyage:', voyageId, islands.length);
            return islands;
          }),
          catchError(error => {
            console.error('❌ Error loading islands:', error);
            return throwError(() => new Error('Failed to load islands: ' + error.message));
          })
        );
      })
    } catch (error: any) {
      return throwError(() => new Error('Failed to load islands: ' + error.message));
    }
  }

  /**
   * Update an existing island
   * @param voyageId The voyage ID
   * @param islandId The island ID to update
   * @param updates Partial island data to update
   * @returns Observable<void>
   */
  updateIsland(voyageId: string, islandId: string, updates: Partial<Omit<Island, 'id'>>): Observable<void> {
    try {
      const voyageRef = doc(this.voyagesCollection, voyageId);
      const islandRef = doc(collection(voyageRef, 'islands'), islandId);

      // Convert enum values to strings for Firestore
      const updateData = { ...updates };
      if (updateData.venue) {
        updateData.venue = updateData.venue.toString() as any;
      }
      if (updateData.sessionType) {
        updateData.sessionType = updateData.sessionType.toString() as any;
      }

      const updatePromise = updateDoc(islandRef, updateData);

      return from(updatePromise).pipe(
        map(() => {
          console.log('✅ Island updated:', islandId);
        }),
        catchError(error => {
          console.error('❌ Error updating island:', error);
          return throwError(() => new Error('Failed to update island: ' + error.message));
        })
      );
    } catch (error: any) {
      return throwError(() => new Error('Failed to update island: ' + error.message));
    }
  }

  /**
   * Delete an island
   * @param voyageId The voyage ID
   * @param islandId The island ID to delete
   * @returns Observable<void>
   */
  deleteIsland(voyageId: string, islandId: string): Observable<void> {
    try {
      const voyageRef = doc(this.voyagesCollection, voyageId);
      const islandRef = doc(collection(voyageRef, 'islands'), islandId);
      const deletePromise = deleteDoc(islandRef);

      return from(deletePromise).pipe(
        map(() => {
          console.log('🗑️ Island deleted:', islandId);
        }),
        catchError(error => {
          console.error('❌ Error deleting island:', error);
          return throwError(() => new Error('Failed to delete island: ' + error.message));
        })
      );
    } catch (error: any) {
      return throwError(() => new Error('Failed to delete island: ' + error.message));
    }
  }

  /**
   * UTILITY METHODS
   */

  /**
   * Map string venue to Deck enum
   */
  private mapStringToDeck(venue: string): Deck {
    switch (venue) {
      case 'Alpha Deck':
        return Deck.ALPHA;
      case 'Bravo Deck':
        return Deck.BRAVO;
      case 'Charlie Deck':
        return Deck.CHARLIE;
      case 'Delta Deck':
        return Deck.DELTA;
      default:
        return Deck.ALPHA;
    }
  }

  /**
   * Map string session type to SessionType enum
   */
  private mapStringToSessionType(sessionType: string): SessionType {
    switch (sessionType) {
      case 'Opening Waters':
        return SessionType.OPENING_WATERS;
      case 'Breakout':
        return SessionType.BREAKOUT;
      case 'Lunch':
        return SessionType.LUNCH;
      case 'Group Photo':
        return SessionType.GROUP_PHOTO;
      case 'Closing Ceremony':
        return SessionType.CLOSING_CEREMONY;
      default:
        return SessionType.BREAKOUT;
    }
  }

  /**
   * Get voyage with all its islands
   * @param voyageId The voyage ID
   * @returns Observable<Voyage | null> Complete voyage with islands
   */
  getVoyageWithIslands(voyageId: string): Observable<Voyage | null> {
    return this.getVoyageById(voyageId).pipe(
      map(voyage => {
        if (!voyage) return null;

        // Load islands for this voyage
        this.getIslandsByVoyage(voyageId).subscribe(islands => {
          voyage.islands = islands;
        });

        return voyage;
      })
    );
  }

  /**
   * NAVIGATOR ROLE MANAGEMENT OPERATIONS
   */

  /**
   * Assigns admin role to a navigator by their email address
   * @param email - Email address of the navigator to assign admin role
   * @returns Observable that emits the operation result
   */
  assignAdminRole(email: string): Observable<{ success: boolean; message: string }> {
    this.assigningRole.set(true);
    this.lastOperationResult.set(null);

    // First, find the navigator by email
    return this.findNavigatorByEmail(email).pipe(
      switchMap((navigator) => {
        if (!navigator) {
          return throwError(() => new Error(`Navigator with email ${email} not found in the navigators collection.`));
        }

        if (navigator.role === 'admin') {
          return of({ success: false, message: `Navigator ${email} is already an admin.` });
        }

        // Update the navigator's role to admin
        const navigatorDocRef = doc(this.firestore, `navigators/${navigator.id}`);
        return from(updateDoc(navigatorDocRef, {
          role: 'admin',
          updatedAt: new Date()
        })).pipe(
          map(() => ({ success: true, message: `Successfully assigned admin role to ${email}` }))
        );
      }),
      catchError((error) => {
        console.error('Error assigning admin role:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return of({ success: false, message: errorMessage });
      }),
      map((result) => {
        this.assigningRole.set(false);
        this.lastOperationResult.set(result);
        return result;
      })
    );
  }

  /**
   * Removes admin role from a navigator by their email address
   * @param email - Email address of the navigator to remove admin role
   * @returns Observable that emits the operation result
   */
  removeAdminRole(email: string): Observable<{ success: boolean; message: string }> {
    this.assigningRole.set(true);
    this.lastOperationResult.set(null);

    return this.findNavigatorByEmail(email).pipe(
      switchMap((navigator) => {
        if (!navigator) {
          return throwError(() => new Error(`Navigator with email ${email} not found in the navigators collection.`));
        }

        if (navigator.role !== 'admin') {
          return of({ success: false, message: `Navigator ${email} is not an admin.` });
        }

        // Update the navigator's role back to navigator
        const navigatorDocRef = doc(this.firestore, `navigators/${navigator.id}`);
        return from(updateDoc(navigatorDocRef, {
          role: 'navigator',
          updatedAt: new Date()
        })).pipe(
          map(() => ({ success: true, message: `Successfully removed admin role from ${email}` }))
        );
      }),
      catchError((error) => {
        console.error('Error removing admin role:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return of({ success: false, message: errorMessage });
      }),
      map((result) => {
        this.assigningRole.set(false);
        this.lastOperationResult.set(result);
        return result;
      })
    );
  }

  /**
   * Gets all navigators with admin role
   * @returns Observable that emits array of admin navigators
   */
  getAdminNavigators(): Observable<Navigator[]> {
    const navigatorsRef = collection(this.firestore, 'navigators');
    const adminQuery = query(navigatorsRef, where('role', '==', 'admin'));

    return from(getDocs(adminQuery)).pipe(
      map(querySnapshot => {
        const admins: Navigator[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          admins.push({
            id: doc.id,
            displayName: data['displayName'] || null,
            email: data['email'] || null,
            photoURL: data['photoURL'] || null,
            techTrack: data['techTrack'] || null,
            expertiseLevel: data['expertiseLevel'] || null,
            hasCompletedCourseSelection: data['hasCompletedCourseSelection'] || false,
            role: data['role'] || 'navigator',
            createdAt: data['createdAt']?.toDate() || new Date(),
            updatedAt: data['updatedAt']?.toDate() || new Date()
          });
        });
        return admins;
      }),
      catchError((error) => {
        console.error('Error fetching admin navigators:', error);
        return of([]);
      })
    );
  }

  /**
   * Finds a navigator by their email address
   * @param email - Email address to search for
   * @returns Observable that emits the found navigator or null
   */
  private findNavigatorByEmail(email: string): Observable<Navigator | null> {
    const navigatorsRef = collection(this.firestore, 'navigators');
    const emailQuery = query(navigatorsRef, where('email', '==', email));

    return from(getDocs(emailQuery)).pipe(
      map(querySnapshot => {
        if (querySnapshot.empty) {
          return null;
        }

        // Get the first matching navigator
        const doc = querySnapshot.docs[0];
        const data = doc.data();

        return {
          id: doc.id,
          displayName: data['displayName'] || null,
          email: data['email'] || null,
          photoURL: data['photoURL'] || null,
          techTrack: data['techTrack'] || null,
          expertiseLevel: data['expertiseLevel'] || null,
          hasCompletedCourseSelection: data['hasCompletedCourseSelection'] || false,
          role: data['role'] || 'navigator',
          createdAt: data['createdAt']?.toDate() || new Date(),
          updatedAt: data['updatedAt']?.toDate() || new Date()
        };
      }),
      catchError((error) => {
        console.error('Error finding navigator by email:', error);
        return of(null);
      })
    );
  }

  /**
   * Checks if a navigator has admin role by their email
   * @param email - Email address to check
   * @returns Observable that emits boolean indicating admin status
   */
  isAdmin(email: string): Observable<boolean> {
    return this.findNavigatorByEmail(email).pipe(
      map(navigator => navigator ? navigator.role === 'admin' : false)
    );
  }
}
