import { Injectable, inject } from '@angular/core';
import { Analytics, logEvent, setUserId, setUserProperties } from '@angular/fire/analytics';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private analytics: Analytics = inject(Analytics);
  private router: Router = inject(Router);

  constructor() {
    this.trackPageViews();
  }

  // Automatically track page views on navigation changes
  private trackPageViews(): void {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      logEvent(this.analytics, 'page_view', {
        page_path: event.urlAfterRedirects,
        page_title: document.title // Assuming title is set by SeoService
      });
    });
  }

  // Log a custom event
  logEvent(eventName: string, eventParams: { [key: string]: any }): void {
    logEvent(this.analytics, eventName, eventParams);
  }

  // Set user ID for tracking
  setUserId(userId: string): void {
    setUserId(this.analytics, userId);
  }

  // Set user properties
  setUserProperties(properties: { [key: string]: any }): void {
    setUserProperties(this.analytics, properties);
  }
}
