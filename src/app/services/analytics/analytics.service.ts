import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Analytics, logEvent, setUserId, setUserProperties } from '@angular/fire/analytics';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private analytics: Analytics = inject(Analytics);
  private router: Router = inject(Router);
  private isBrowser: boolean;

  constructor() {
    this.isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
    if (this.isBrowser) {
      this.trackPageViews();
    }
  }

  // Automatically track page views on navigation changes
  private trackPageViews(): void {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      logEvent(this.analytics, 'page_view', {
        page_path: event.urlAfterRedirects,
        page_title: document.title
      });
    });
  }

  // Log a custom event
  logEvent(eventName: string, eventParams: { [key: string]: any }): void {
    if (this.isBrowser) {
      logEvent(this.analytics, eventName, eventParams);
    }
  }

  // Set user ID for tracking
  setUserId(userId: string): void {
    if (this.isBrowser) {
      setUserId(this.analytics, userId);
    }
  }

  // Set user properties
  setUserProperties(properties: { [key: string]: any }): void {
    if (this.isBrowser) {
      setUserProperties(this.analytics, properties);
    }
  }
}
