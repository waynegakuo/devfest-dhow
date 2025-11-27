import { Component, inject, OnInit } from '@angular/core';
import {RouterLink} from '@angular/router';
import { SeoService } from '../../services/seo/seo.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    RouterLink
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent implements OnInit {
  private seoService = inject(SeoService);

  ngOnInit() {
    this.seoService.setMetaTags({
      title: 'DevFest Pwani 2025 | The Ultimate AI Voyage',
      description: 'Join us for DevFest Pwani 2025, a one-of-a-kind AI conference experience. Explore the latest in AI, connect with experts, and set sail on a voyage of discovery.',
      ogImageUrl: 'https://devfest-dhow.web.app/assets/images/devfest-dhow-og-image.jpg' // Example URL
    });

    this.seoService.setStructuredData({
      '@context': 'https://schema.org',
      '@type': 'Event',
      'name': 'DevFest Pwani 2025',
      'startDate': '2025-11-29', // Replace with your event date
      'endDate': '2025-11-29',   // Replace with your event date
      'eventAttendanceMode': 'https://schema.org/OfflineEventAttendanceMode',
      'eventStatus': 'https://schema.org/EventScheduled',
      'location': {
        '@type': 'Place',
        'name': 'Light International School, Nyali - Mombasa',
        'address': {
          '@type': 'PostalAddress',
          'streetAddress': 'P.O Box 1835-80100',
          'addressLocality': 'Nyali, Mombasa',
          'addressCountry': 'KE'
        }
      },
      'image': [
        'https://devfest-dhow.web.app/assets/images/devfest-dhow-og-image.jpg' // Example URL
       ],
      'description': 'The ultimate AI conference voyage. Explore the latest in AI, connect with experts, and set sail on a voyage of discovery.',
      'organizer': {
        '@type': 'Organization',
        'name': 'GDG Pwani',
        'url': 'https://gdg.community.dev/gdg-pwani/'
      }
    });
  }
}
