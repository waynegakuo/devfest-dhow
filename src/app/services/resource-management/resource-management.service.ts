import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
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
import { TechTrack, ExpertiseLevel } from '../../models/navigator.model';

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
  private readonly resourcesCollection = collection(this.firestore, 'resources') as CollectionReference<DocumentData>;

  /**
   * Upload a new resource to Firestore
   */
  uploadResource(resourceData: ResourceUploadData): Observable<string> {
    const resource: PreparatoryContent = {
      ...resourceData,
      id: '', // Will be set by Firestore
      createdAt: new Date()
    };

    // Get the track-specific subcollection
    const trackCollection = collection(this.firestore, `resources/${resourceData.techTrack}`);

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
    const trackCollection = collection(this.firestore, `resources/${track}`);
    const q = query(trackCollection, orderBy('createdAt', 'desc'));

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
  }

  /**
   * Get resources by track and content type
   */
  getResourcesByTrackAndType(track: TechTrack, contentType: ContentType): Observable<PreparatoryContent[]> {
    const trackCollection = collection(this.firestore, `resources/${track}`);
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
    const resourceDoc = doc(this.firestore, `resources/${track}/${resourceId}`);

    return from(updateDoc(resourceDoc, updates)).pipe(
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
    const resourceDoc = doc(this.firestore, `resources/${track}/${resourceId}`);

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
   * Get all available tracks with resource counts
   */
  getTracksWithResourceCounts(): Observable<{ track: TechTrack; count: number }[]> {
    const tracks: TechTrack[] = [
      'Web Development',
      'Mobile Development',
      'Cloud & DevOps',
      'AI & Machine Learning',
      'Game Development',
      'UI/UX Design'
    ];

    const trackPromises = tracks.map(async track => {
      const trackCollection = collection(this.firestore, `resources/${track}`);
      const snapshot = await getDocs(trackCollection);
      return { track, count: snapshot.size };
    });

    return from(Promise.all(trackPromises)).pipe(
      catchError(error => {
        console.error('❌ Error fetching track counts:', error);
        return throwError(() => new Error('Failed to fetch track counts'));
      })
    );
  }

  /**
   * Get featured resources across all tracks
   */
  getFeaturedResources(): Observable<PreparatoryContent[]> {
    const tracks: TechTrack[] = [
      'Web Development',
      'Mobile Development',
      'Cloud & DevOps',
      'AI & Machine Learning',
      'Game Development',
      'UI/UX Design'
    ];

    const featuredPromises = tracks.map(async track => {
      const trackCollection = collection(this.firestore, `resources/${track}`);
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

    return from(Promise.all(featuredPromises)).pipe(
      map(results => results.flat()),
      catchError(error => {
        console.error('❌ Error fetching featured resources:', error);
        return throwError(() => new Error('Failed to fetch featured resources'));
      })
    );
  }
}
