import {Injectable, inject, signal, EnvironmentInjector, runInInjectionContext} from '@angular/core';
import {
  Firestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp
} from '@angular/fire/firestore';
import { AuthService } from '../auth/auth.service';
import { Navigator, CourseSelection } from '../../models/navigator.model';
import { from, Observable, switchMap, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NavigatorService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private environmentInjector = inject(EnvironmentInjector);


  // Signal for current navigator data
  currentNavigator = signal<Navigator | null>(null);

  /**
   * Creates or updates navigator profile in Firestore
   */
  async createOrUpdateNavigator(): Promise<Navigator | null> {
    const user = this.authService.currentUser();

    if (!user) {
      console.error('No authenticated user found');
      return null;
    }

    try {
      const navigatorRef = doc(this.firestore, 'navigators', user.uid);
      const navigatorDoc = await getDoc(navigatorRef);

      const now = new Date();

      if (navigatorDoc.exists()) {
        // Update existing navigator
        const existingData = navigatorDoc.data() as Navigator;
        const updatedNavigator: Navigator = {
          ...existingData,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          updatedAt: now
        };

        await updateDoc(navigatorRef, {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          updatedAt: serverTimestamp()
        });

        this.currentNavigator.set(updatedNavigator);
        return updatedNavigator;
      } else {
        // Create new navigator
        const newNavigator: Navigator = {
          id: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          techTrack: null,
          expertiseLevel: null,
          hasCompletedCourseSelection: false,
          role: 'navigator',
          createdAt: now,
          updatedAt: now
        };

        await setDoc(navigatorRef, {
          ...newNavigator,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        this.currentNavigator.set(newNavigator);
        return newNavigator;
      }
    } catch (error) {
      console.error('Error creating/updating navigator:', error);
      return null;
    }
  }

  /**
   * Gets navigator data from Firestore
   */
  getNavigator(): Observable<Navigator | null> {
    const user = this.authService.currentUser();

    if (!user) {
      return of(null);
    }


    // Run in injection context to ensure proper DI resolution
    return runInInjectionContext(this.environmentInjector, () => {
      // Get reference to the navigator document in Firestore
      const navigatorRef = doc(this.firestore, 'navigators', user.uid);

      // Get navigator document and transform the response
      return from(getDoc(navigatorRef)).pipe(
        switchMap((navigatorDoc) => {
          if (navigatorDoc.exists()) {
            // Convert Firestore timestamp to Date objects and create navigator data
            const navigatorData = {
              ...navigatorDoc.data(),
              createdAt: navigatorDoc.data()['createdAt']?.toDate() || new Date(),
              updatedAt: navigatorDoc.data()['updatedAt']?.toDate() || new Date()
            } as Navigator;

            // Update the navigator signal with latest data
            this.currentNavigator.set(navigatorData);
            return of(navigatorData);
          } else {
            // Create navigator if doesn't exist
            return from(this.createOrUpdateNavigator());
          }
        })
      );
    })
  }

  /**
   * Saves course selection preferences
   */
  async saveCourseSelection(courseSelection: CourseSelection): Promise<boolean> {
    const user = this.authService.currentUser();

    if (!user) {
      console.error('No authenticated user found');
      return false;
    }

    try {
      const navigatorRef = doc(this.firestore, 'navigators', user.uid);

      await updateDoc(navigatorRef, {
        techTrack: courseSelection.techTrack,
        expertiseLevel: courseSelection.expertiseLevel,
        hasCompletedCourseSelection: true,
        updatedAt: serverTimestamp()
      });

      // Update local signal
      const currentNav = this.currentNavigator();
      if (currentNav) {
        this.currentNavigator.set({
          ...currentNav,
          techTrack: courseSelection.techTrack,
          expertiseLevel: courseSelection.expertiseLevel,
          hasCompletedCourseSelection: true,
          updatedAt: new Date()
        });
      }

      return true;
    } catch (error) {
      console.error('Error saving course selection:', error);
      return false;
    }
  }

  /**
   * Checks if navigator has completed course selection
   */
  hasCompletedCourseSelection(): boolean {
    const navigator = this.currentNavigator();
    return navigator?.hasCompletedCourseSelection || false;
  }

  /**
   * Gets navigator's tech track
   */
  getTechTrack(): string | null {
    return this.currentNavigator()?.techTrack || null;
  }

  /**
   * Gets navigator's expertise level
   */
  getExpertiseLevel(): string | null {
    return this.currentNavigator()?.expertiseLevel || null;
  }

  /**
   * Resets course selection
   */
  async resetCourseSelection(): Promise<boolean> {
    const user = this.authService.currentUser();

    if (!user) {
      return false;
    }

    try {
      const navigatorRef = doc(this.firestore, 'navigators', user.uid);

      await updateDoc(navigatorRef, {
        techTrack: null,
        expertiseLevel: null,
        hasCompletedCourseSelection: false,
        updatedAt: serverTimestamp()
      });

      // Update local signal
      const currentNav = this.currentNavigator();
      if (currentNav) {
        this.currentNavigator.set({
          ...currentNav,
          techTrack: null,
          expertiseLevel: null,
          hasCompletedCourseSelection: false,
          updatedAt: new Date()
        });
      }

      return true;
    } catch (error) {
      console.error('Error resetting course selection:', error);
      return false;
    }
  }
}
