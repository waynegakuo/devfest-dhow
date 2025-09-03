import { Injectable, inject, signal } from '@angular/core';
import {
  Firestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  getDoc
} from '@angular/fire/firestore';
import { Navigator, NavigatorRole } from '../../models/navigator.model';
import { from, Observable, throwError, of } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private firestore = inject(Firestore);

  // Signal to track loading state
  assigningRole = signal<boolean>(false);

  // Signal to track the last operation result
  lastOperationResult = signal<{ success: boolean; message: string } | null>(null);

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
