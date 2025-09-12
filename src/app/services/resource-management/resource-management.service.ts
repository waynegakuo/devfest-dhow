import {Injectable, inject, runInInjectionContext, EnvironmentInjector} from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  CollectionReference,
  DocumentData
} from '@angular/fire/firestore';
import { PreparatoryContent, ContentType } from '../../models/preparatory-content.model';
import { TechTrack, ExpertiseLevel, Track } from '../../models/navigator.model';

export interface ResourceUploadData {
  title: string;
  description: string;
  type: ContentType;
  url: string;
  techTrack: TechTrack;
  expertiseLevel: ExpertiseLevel[];
  duration?: string;
  author?: string;
  source?: string;
  tags: string[];
  featured: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ResourceManagementService {
  private firestore = inject(Firestore);
  private environmentInjector = inject(EnvironmentInjector);
  private readonly resourcesCollection = collection(this.firestore, 'resources') as CollectionReference<DocumentData>;

  /**
   * Map track names to their Firestore-safe collection IDs
   */
  private getTrackCollectionId(trackName: TechTrack): string {
    const trackMap: Record<TechTrack, string> = {
      'Web Development': 'web-development',
      'Mobile Development': 'mobile-development',
      'Cloud & DevOps': 'cloud-devops',
      'AI & Machine Learning': 'ai-machine-learning',
      'Game Development': 'game-development',
      'UI/UX Design': 'ui-ux-design',
      // Legacy support for old track names
      'AI/ML': 'ai-machine-learning',
      'Cloud': 'cloud-devops',
      'Web': 'web-development',
      'Mobile': 'mobile-development'
    };

    return trackMap[trackName] || trackName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }

  /**
   * Upload a new resource to Firestore
   */
  uploadResource(resourceData: ResourceUploadData): Observable<string> {
    // Filter out undefined values to prevent Firestore errors
    const cleanedData = Object.fromEntries(
      Object.entries(resourceData).filter(([_, value]) => value !== undefined)
    ) as ResourceUploadData;

    const resource: PreparatoryContent = {
      ...cleanedData,
      id: '', // Will be set by Firestore
      createdAt: new Date()
    };

    // Get the track-specific subcollection using safe collection ID
    const trackCollectionId = this.getTrackCollectionId(resourceData.techTrack);
    const trackCollection = collection(this.firestore, `tracks/${trackCollectionId}/resources`);

    return from(addDoc(trackCollection, resource)).pipe(
      map(docRef => {
        console.log('✅ Resource uploaded successfully:', docRef.id);
        return docRef.id;
      }),
      catchError(error => {
        console.error('❌ Error uploading resource:', error);
        return throwError(() => new Error('Failed to upload resource'));
      })
    );
  }

  /**
   * Get all resources for a specific track
   */
  getResourcesByTrack(track: TechTrack): Observable<PreparatoryContent[]> {
    const trackCollectionId = this.getTrackCollectionId(track);
    const trackCollection = collection(this.firestore, `tracks/${trackCollectionId}/resources`);
    const q = query(trackCollection, orderBy('createdAt', 'desc'));

    return runInInjectionContext(this.environmentInjector, () => {
      return from(getDocs(q)).pipe(
        map(snapshot => {
          const resources: PreparatoryContent[] = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            resources.push({
              ...data,
              id: doc.id,
              createdAt: data['createdAt']?.toDate() || new Date()
            } as PreparatoryContent);
          });
          return resources;
        }),
        catchError(error => {
          console.error('❌ Error fetching resources:', error);
          return throwError(() => new Error('Failed to fetch resources'));
        })
      );
    });
  }

  /**
   * Get resources by track and content type
   */
  getResourcesByTrackAndType(track: TechTrack, contentType: ContentType): Observable<PreparatoryContent[]> {
    const trackCollectionId = this.getTrackCollectionId(track);
    const trackCollection = collection(this.firestore, `tracks/${trackCollectionId}/resources`);
    const q = query(
      trackCollection,
      where('type', '==', contentType),
      orderBy('createdAt', 'desc')
    );

    return from(getDocs(q)).pipe(
      map(snapshot => {
        const resources: PreparatoryContent[] = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          resources.push({
            ...data,
            id: doc.id,
            createdAt: data['createdAt']?.toDate() || new Date()
          } as PreparatoryContent);
        });
        return resources;
      }),
      catchError(error => {
        console.error('❌ Error fetching resources by type:', error);
        return throwError(() => new Error('Failed to fetch resources by type'));
      })
    );
  }

  /**
   * Update an existing resource
   */
  updateResource(track: TechTrack, resourceId: string, updates: Partial<ResourceUploadData>): Observable<void> {
    // Filter out undefined values to prevent Firestore errors
    const cleanedUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    ) as Partial<ResourceUploadData>;

    const trackCollectionId = this.getTrackCollectionId(track);
    const resourceDoc = doc(this.firestore, `tracks/${trackCollectionId}/resources/${resourceId}`);

    return from(updateDoc(resourceDoc, cleanedUpdates)).pipe(
      map(() => {
        console.log('✅ Resource updated successfully:', resourceId);
      }),
      catchError(error => {
        console.error('❌ Error updating resource:', error);
        return throwError(() => new Error('Failed to update resource'));
      })
    );
  }

  /**
   * Delete a resource
   */
  deleteResource(track: TechTrack, resourceId: string): Observable<void> {
    const trackCollectionId = this.getTrackCollectionId(track);
    const resourceDoc = doc(this.firestore, `tracks/${trackCollectionId}/resources/${resourceId}`);

    return from(deleteDoc(resourceDoc)).pipe(
      map(() => {
        console.log('✅ Resource deleted successfully:', resourceId);
      }),
      catchError(error => {
        console.error('❌ Error deleting resource:', error);
        return throwError(() => new Error('Failed to delete resource'));
      })
    );
  }

  /**
   * Get all tracks from Firestore
   */
  getAllTracks(): Observable<Track[]> {
    return runInInjectionContext(this.environmentInjector, () => {
      const tracksCollection = collection(this.firestore, 'tracks');
      const q = query(tracksCollection, where('isActive', '==', true), orderBy('name'));

      return from(getDocs(q)).pipe(
        map(snapshot => {
          const tracks: Track[] = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            tracks.push({
              ...data,
              id: doc.id,
              createdAt: data['createdAt']?.toDate() || new Date(),
              updatedAt: data['updatedAt']?.toDate() || new Date()
            } as Track);
          });
          return tracks;
        }),
        catchError(error => {
          console.error('❌ Error fetching tracks:', error);
          return throwError(() => new Error('Failed to fetch tracks'));
        })
      );
    })

  }

  /**
   * Get all available tracks with resource counts
   */
  getTracksWithResourceCounts(): Observable<{ track: TechTrack; count: number }[]> {
    return runInInjectionContext(this.environmentInjector, () => {
      return this.getAllTracks().pipe(
        switchMap(tracks => {
          const trackPromises = tracks.map(async trackData => {
            const track = trackData.name as TechTrack;
            const trackCollectionId = this.getTrackCollectionId(track);
            const trackCollection = collection(this.firestore, `tracks/${trackCollectionId}/resources`);
            const snapshot = await getDocs(trackCollection);
            return { track, count: snapshot.size };
          });
          return from(Promise.all(trackPromises));
        }),
        catchError(error => {
          console.error('❌ Error fetching track counts:', error);
          return throwError(() => new Error('Failed to fetch track counts'));
        })
      );
    });
  }

  /**
   * Get featured resources across all tracks
   */
  getFeaturedResources(): Observable<PreparatoryContent[]> {
    return this.getAllTracks().pipe(
      switchMap(tracks => {
        const featuredPromises = tracks.map(async trackData => {
          const track = trackData.name as TechTrack;
          const trackCollectionId = this.getTrackCollectionId(track);
          const trackCollection = collection(this.firestore, `tracks/${trackCollectionId}/resources`);
          const q = query(trackCollection, where('featured', '==', true));
          const snapshot = await getDocs(q);
          const resources: PreparatoryContent[] = [];

          snapshot.forEach(doc => {
            const data = doc.data();
            resources.push({
              ...data,
              id: doc.id,
              createdAt: data['createdAt']?.toDate() || new Date()
            } as PreparatoryContent);
          });

          return resources;
        });

        return from(Promise.all(featuredPromises));
      }),
      map(results => results.flat()),
      catchError(error => {
        console.error('❌ Error fetching featured resources:', error);
        return throwError(() => new Error('Failed to fetch featured resources'));
      })
    );
  }
}
