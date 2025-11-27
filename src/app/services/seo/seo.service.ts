import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';

export interface SeoData {
  title: string;
  description: string;
  ogType?: string;
  ogImageUrl?: string;
  twitterCard?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private isBrowser: boolean;

  constructor(
    private title: Title,
    private meta: Meta,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  setMetaTags(data: SeoData) {
    // Set standard meta tags
    this.title.setTitle(data.title);
    this.meta.updateTag({ name: 'description', content: data.description });

    // Set Open Graph tags for social sharing
    this.meta.updateTag({ property: 'og:title', content: data.title });
    this.meta.updateTag({ property: 'og:description', content: data.description });
    this.meta.updateTag({ property: 'og:type', content: data.ogType || 'website' });
    if (data.ogImageUrl) {
      this.meta.updateTag({ property: 'og:image', content: data.ogImageUrl });
    }

    // Set Twitter card tags
    this.meta.updateTag({ name: 'twitter:card', content: data.twitterCard || 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: data.title });
    this.meta.updateTag({ name: 'twitter:description', content: data.description });
    if (data.ogImageUrl) {
      this.meta.updateTag({ name: 'twitter:image', content: data.ogImageUrl });
    }
  }

  setStructuredData(data: object) {
    if (this.isBrowser) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(data);
      document.head.appendChild(script);
    }
  }
}
