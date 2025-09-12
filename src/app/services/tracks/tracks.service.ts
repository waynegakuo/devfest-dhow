import { Injectable, inject } from '@angular/core';
import { Observable, map, catchError, of, forkJoin, from } from 'rxjs';
import {
  Firestore,
  collection,
  collectionData,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc
} from '@angular/fire/firestore';
import { TechTrack, ExpertiseLevel } from '../../models/navigator.model';
import { PreparatoryContent, CuratedContent, PreparatoryContentSection } from '../../models/preparatory-content.model';

@Injectable({
  providedIn: 'root'
})
export class TracksService {
  private firestore = inject(Firestore);

  /**
   * Convert TechTrack to safe collection ID
   */
  private getTrackCollectionId(trackName: TechTrack): string {
    const trackMap: Record<TechTrack, string> = {
      'Web Development': 'web-development',
      'Mobile Development': 'mobile-development',
      'Cloud & DevOps': 'cloud-devops',
      'AI & Machine Learning': 'ai-machine-learning',
      'Game Development': 'game-development',
      'UI/UX Design': 'ui-ux-design'
    };
    return trackMap[trackName] || trackName.toLowerCase().replace(/[\/\s&]/g, '-');
  }

  /**
   * Get curated content for a specific tech track and expertise level
   * @param techTrack - The technology track
   * @param expertiseLevel - The expertise level
   * @returns Observable of curated content
   */
  getCuratedContent(techTrack: TechTrack, expertiseLevel: ExpertiseLevel): Observable<CuratedContent> {
    const trackCollectionId = this.getTrackCollectionId(techTrack);

    const resourcesCollection = collection(this.firestore, `tracks/${trackCollectionId}/resources`);
    const resourceQuery = query(
      resourcesCollection,
      where('expertiseLevel', 'array-contains', expertiseLevel),
      orderBy('createdAt', 'desc')
    );

    return from(getDocs(resourceQuery)).pipe(
      map(snapshot => {
        const preparatoryContent: PreparatoryContent[] = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          preparatoryContent.push({
            ...data,
            id: doc.id,
            createdAt: data['createdAt']?.toDate() || new Date()
          } as PreparatoryContent);
        });

        // If no content found in Firestore, provide fallback mock data
        if (preparatoryContent.length === 0) {
          preparatoryContent.push({
            id: 'mock-1',
            title: `${techTrack} Essential Guide for ${expertiseLevel}s`,
            description: `A comprehensive introduction to ${techTrack} designed specifically for ${expertiseLevel.toLowerCase()} developers.`,
            type: 'documentation',
            url: 'https://developers.google.com',
            techTrack: techTrack,
            expertiseLevel: [expertiseLevel],
            author: 'DevFest Team',
            source: 'DevFest Dhow',
            tags: [techTrack.toLowerCase(), expertiseLevel.toLowerCase(), 'getting-started'],
            featured: true,
            createdAt: new Date()
          });

          preparatoryContent.push({
            id: 'mock-2',
            title: `Hands-on ${techTrack} Tutorial`,
            description: `Step-by-step tutorial to build your first ${techTrack} project with practical examples.`,
            type: 'tutorial',
            url: 'https://developers.google.com',
            techTrack: techTrack,
            expertiseLevel: [expertiseLevel],
            duration: '2 hours',
            author: 'DevFest Instructors',
            source: 'DevFest Academy',
            tags: [techTrack.toLowerCase(), 'tutorial', 'hands-on'],
            featured: false,
            createdAt: new Date()
          });
        }

        // Group content by type/category for sections
        const sections: PreparatoryContentSection[] = [];

        // Essential Resources section
        const essentials = preparatoryContent.filter(content =>
          content.featured || content.type === 'documentation'
        );
        if (essentials.length > 0) {
          sections.push({
            title: 'Essential Resources',
            description: 'Core materials to get you started on your voyage',
            items: essentials
          });
        }

        // Advanced Materials section
        const advanced = preparatoryContent.filter(content =>
          content.expertiseLevel.includes('Intermediate') ||
          content.expertiseLevel.includes('Expert')
        );
        if (advanced.length > 0) {
          sections.push({
            title: 'Advanced Materials',
            description: 'Deep dive into advanced concepts and techniques',
            items: advanced
          });
        }

        // Practical Tutorials section
        const tutorials = preparatoryContent.filter(content =>
          content.type === 'tutorial' || content.type === 'video'
        );
        if (tutorials.length > 0) {
          sections.push({
            title: 'Practical Tutorials',
            description: 'Hands-on learning with step-by-step guides',
            items: tutorials
          });
        }

        // Additional Reading section
        const articles = preparatoryContent.filter(content =>
          content.type === 'article' || content.type === 'guide'
        );
        if (articles.length > 0) {
          sections.push({
            title: 'Additional Reading',
            description: 'Supplementary materials to expand your knowledge',
            items: articles
          });
        }

        return {
          trackName: techTrack,
          expertiseLevel,
          sections,
          totalItems: preparatoryContent.length
        };
      }),
      catchError(error => {
        console.error('Error fetching curated content from Firestore:', error);
        return of({
          trackName: techTrack,
          expertiseLevel,
          sections: [],
          totalItems: 0
        });
      })
    );
  }

  /**
   * Get featured content from all track subcollections
   * @returns Observable of featured preparatory content
   */
  getFeaturedContent(): Observable<PreparatoryContent[]> {
    // Define all available tracks
    const allTracks: TechTrack[] = ['Web Development', 'Mobile Development', 'Cloud & DevOps', 'AI & Machine Learning', 'Game Development', 'UI/UX Design'];

    // Create queries for each track's resources subcollection
    const trackQueries = allTracks.map(track => {
      const trackCollectionId = this.getTrackCollectionId(track);
      const resourcesCollection = collection(this.firestore, `tracks/${trackCollectionId}/resources`);
      const featuredQuery = query(
        resourcesCollection,
        where('featured', '==', true),
        orderBy('createdAt', 'desc'),
        limit(2) // Limit per track to avoid too many results
      );

      return from(getDocs(featuredQuery)).pipe(
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
          console.error(`Error fetching featured content from ${track}:`, error);
          return of([]);
        })
      );
    });

    return forkJoin(trackQueries).pipe(
      map(results => {
        // Flatten all results and sort by creation date
        const allFeatured = results.flat().sort((a, b) =>
          b.createdAt.getTime() - a.createdAt.getTime()
        );
        // Return top 6 featured items
        return allFeatured.slice(0, 6);
      }),
      catchError(error => {
        console.error('Error fetching featured content from Firestore:', error);
        return of([]);
      })
    );
  }

  /**
   * Search content in all track subcollections
   * @param searchQuery - Search query string
   * @returns Observable of matching preparatory content
   */
  searchContent(searchQuery: string): Observable<PreparatoryContent[]> {
    // Define all available tracks
    const allTracks: TechTrack[] = ['Web Development', 'Mobile Development', 'Cloud & DevOps', 'AI & Machine Learning', 'Game Development', 'UI/UX Design'];
    const query = searchQuery.toLowerCase();

    // Create queries for each track's resources subcollection
    const trackQueries = allTracks.map(track => {
      const trackCollectionId = this.getTrackCollectionId(track);
      const resourcesCollection = collection(this.firestore, `tracks/${trackCollectionId}/resources`);

      return from(getDocs(resourcesCollection)).pipe(
        map(snapshot => {
          const resources: PreparatoryContent[] = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            const resource = {
              ...data,
              id: doc.id,
              createdAt: data['createdAt']?.toDate() || new Date()
            } as PreparatoryContent;

            // Filter by search query
            if (resource.title?.toLowerCase().includes(query) ||
                resource.description?.toLowerCase().includes(query) ||
                resource.tags?.some((tag: string) => tag.toLowerCase().includes(query))) {
              resources.push(resource);
            }
          });
          return resources;
        }),
        catchError(error => {
          console.error(`Error searching content in ${track}:`, error);
          return of([]);
        })
      );
    });

    return forkJoin(trackQueries).pipe(
      map(results => {
        // Flatten all results and sort by creation date
        return results.flat().sort((a, b) =>
          b.createdAt.getTime() - a.createdAt.getTime()
        );
      }),
      catchError(error => {
        console.error('Error searching content in Firestore:', error);
        return of([]);
      })
    );
  }

  /**
   * Get content by specific tech track from its subcollection
   * @param techTrack - The technology track to filter by
   * @returns Observable of preparatory content for the track
   */
  getContentByTrack(techTrack: TechTrack): Observable<PreparatoryContent[]> {
    const trackCollectionId = this.getTrackCollectionId(techTrack);
    const resourcesCollection = collection(this.firestore, `tracks/${trackCollectionId}/resources`);
    const trackQuery = query(resourcesCollection, orderBy('createdAt', 'desc'));

    return from(getDocs(trackQuery)).pipe(
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
        console.error(`Error fetching ${techTrack} content from Firestore:`, error);
        return of([]);
      })
    );
  }
}
