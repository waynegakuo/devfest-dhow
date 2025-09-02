import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { TechTrack, ExpertiseLevel } from '../../models/navigator.model';
import { PreparatoryContent, CuratedContent, PreparatoryContentSection } from '../../models/preparatory-content.model';

@Injectable({
  providedIn: 'root'
})
export class PreparatoryContentService {

  // Mock data for preparatory content
  private mockContent: PreparatoryContent[] = [
    // AI/ML Content
    {
      id: 'aiml-1',
      title: 'Introduction to Machine Learning',
      description: 'Comprehensive guide to get started with machine learning concepts and fundamentals.',
      type: 'documentation',
      url: 'https://developers.google.com/machine-learning/crash-course',
      techTrack: 'AI/ML',
      expertiseLevel: ['Beginner'],
      author: 'Google AI',
      source: 'Google Developers',
      tags: ['machine-learning', 'basics', 'fundamentals'],
      featured: true,
      createdAt: new Date('2024-01-15')
    },
    {
      id: 'aiml-2',
      title: 'TensorFlow Developer Certification Guide',
      description: 'Complete preparation guide for TensorFlow Developer Certificate with hands-on examples.',
      type: 'guide',
      url: 'https://www.tensorflow.org/certificate',
      techTrack: 'AI/ML',
      expertiseLevel: ['Intermediate', 'Expert'],
      duration: '40 hours',
      author: 'TensorFlow Team',
      source: 'TensorFlow',
      tags: ['tensorflow', 'certification', 'deep-learning'],
      featured: true,
      createdAt: new Date('2024-02-01')
    },
    {
      id: 'aiml-3',
      title: 'Building AI Applications with Gemini API',
      description: 'Learn how to integrate Gemini AI into your applications with practical examples.',
      type: 'video',
      url: 'https://www.youtube.com/watch?v=example-gemini',
      techTrack: 'AI/ML',
      expertiseLevel: ['Intermediate', 'Expert'],
      duration: '45 min',
      author: 'Google AI',
      source: 'YouTube',
      tags: ['gemini', 'api', 'integration'],
      featured: false,
      createdAt: new Date('2024-03-10')
    },

    // Cloud Content
    {
      id: 'cloud-1',
      title: 'Google Cloud Platform Fundamentals',
      description: 'Essential concepts and services for getting started with Google Cloud Platform.',
      type: 'documentation',
      url: 'https://cloud.google.com/docs/overview',
      techTrack: 'Cloud',
      expertiseLevel: ['Beginner'],
      author: 'Google Cloud',
      source: 'Google Cloud Docs',
      tags: ['gcp', 'fundamentals', 'cloud-basics'],
      featured: true,
      createdAt: new Date('2024-01-20')
    },
    {
      id: 'cloud-2',
      title: 'Kubernetes Best Practices',
      description: 'Advanced patterns and practices for running production workloads on Kubernetes.',
      type: 'guide',
      url: 'https://kubernetes.io/docs/concepts/configuration/best-practices/',
      techTrack: 'Cloud',
      expertiseLevel: ['Intermediate', 'Expert'],
      author: 'Kubernetes Community',
      source: 'Kubernetes.io',
      tags: ['kubernetes', 'best-practices', 'production'],
      featured: true,
      createdAt: new Date('2024-02-15')
    },
    {
      id: 'cloud-3',
      title: 'Serverless on Google Cloud Run',
      description: 'Build and deploy containerized applications using Google Cloud Run serverless platform.',
      type: 'tutorial',
      url: 'https://cloud.google.com/run/docs/tutorials',
      techTrack: 'Cloud',
      expertiseLevel: ['Intermediate'],
      duration: '2 hours',
      author: 'Google Cloud',
      source: 'Google Cloud',
      tags: ['cloud-run', 'serverless', 'containers'],
      featured: false,
      createdAt: new Date('2024-03-05')
    },

    // Web Content
    {
      id: 'web-1',
      title: 'Modern JavaScript Fundamentals',
      description: 'Master ES6+ features, async programming, and modern JavaScript development patterns.',
      type: 'article',
      url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
      techTrack: 'Web',
      expertiseLevel: ['Beginner', 'Intermediate'],
      author: 'MDN Contributors',
      source: 'MDN Web Docs',
      tags: ['javascript', 'es6', 'fundamentals'],
      featured: true,
      createdAt: new Date('2024-01-10')
    },
    {
      id: 'web-2',
      title: 'Angular 19 Complete Guide',
      description: 'Comprehensive tutorial covering Angular 19 new features, standalone components, and signals.',
      type: 'video',
      url: 'https://www.youtube.com/watch?v=example-angular19',
      techTrack: 'Web',
      expertiseLevel: ['Intermediate', 'Expert'],
      duration: '3 hours',
      author: 'Angular Team',
      source: 'YouTube',
      tags: ['angular', 'angular19', 'standalone-components'],
      featured: true,
      createdAt: new Date('2024-03-01')
    },
    {
      id: 'web-3',
      title: 'Progressive Web Apps (PWA) Mastery',
      description: 'Build fast, reliable, and engaging web applications with PWA technologies.',
      type: 'tutorial',
      url: 'https://web.dev/progressive-web-apps/',
      techTrack: 'Web',
      expertiseLevel: ['Intermediate'],
      duration: '4 hours',
      author: 'Chrome DevRel',
      source: 'web.dev',
      tags: ['pwa', 'service-worker', 'offline'],
      featured: false,
      createdAt: new Date('2024-02-20')
    },

    // Mobile Content
    {
      id: 'mobile-1',
      title: 'Flutter Development Basics',
      description: 'Get started with Flutter framework for cross-platform mobile app development.',
      type: 'documentation',
      url: 'https://docs.flutter.dev/get-started',
      techTrack: 'Mobile',
      expertiseLevel: ['Beginner'],
      author: 'Flutter Team',
      source: 'Flutter Docs',
      tags: ['flutter', 'mobile', 'cross-platform'],
      featured: true,
      createdAt: new Date('2024-01-25')
    },
    {
      id: 'mobile-2',
      title: 'Advanced Flutter State Management',
      description: 'Master complex state management patterns in Flutter using Bloc, Provider, and Riverpod.',
      type: 'guide',
      url: 'https://docs.flutter.dev/development/data-and-backend/state-mgmt',
      techTrack: 'Mobile',
      expertiseLevel: ['Intermediate', 'Expert'],
      author: 'Flutter Community',
      source: 'Flutter Docs',
      tags: ['flutter', 'state-management', 'bloc'],
      featured: true,
      createdAt: new Date('2024-02-28')
    },
    {
      id: 'mobile-3',
      title: 'Firebase for Mobile Apps',
      description: 'Integrate Firebase services into your mobile applications for authentication, database, and more.',
      type: 'tutorial',
      url: 'https://firebase.google.com/docs/flutter/setup',
      techTrack: 'Mobile',
      expertiseLevel: ['Intermediate'],
      duration: '90 min',
      author: 'Firebase Team',
      source: 'Firebase',
      tags: ['firebase', 'backend', 'authentication'],
      featured: false,
      createdAt: new Date('2024-03-15')
    }
  ];

  /**
   * Get curated content based on user's tech track and expertise level
   */
  getCuratedContent(techTrack: TechTrack, expertiseLevel: ExpertiseLevel): Observable<CuratedContent> {
    // Filter content by track and expertise level
    const relevantContent = this.mockContent.filter(content =>
      content.techTrack === techTrack &&
      content.expertiseLevel.includes(expertiseLevel)
    );

    // Organize content into sections
    const sections: PreparatoryContentSection[] = [
      {
        title: 'Essential Documentation',
        description: 'Core documentation and guides to build your foundation',
        items: relevantContent.filter(content =>
          content.type === 'documentation' || content.type === 'guide'
        ).sort((a, b) => Number(b.featured) - Number(a.featured))
      },
      {
        title: 'Video Tutorials',
        description: 'Visual learning resources and step-by-step tutorials',
        items: relevantContent.filter(content =>
          content.type === 'video' || content.type === 'tutorial'
        ).sort((a, b) => Number(b.featured) - Number(a.featured))
      },
      {
        title: 'Articles & Insights',
        description: 'In-depth articles and community insights',
        items: relevantContent.filter(content =>
          content.type === 'article'
        ).sort((a, b) => Number(b.featured) - Number(a.featured))
      }
    ].filter(section => section.items.length > 0); // Only include sections with content

    const curatedContent: CuratedContent = {
      trackName: techTrack,
      expertiseLevel,
      sections,
      totalItems: relevantContent.length
    };

    return of(curatedContent);
  }

  /**
   * Get featured content across all tracks for dashboard highlights
   */
  getFeaturedContent(): Observable<PreparatoryContent[]> {
    const featured = this.mockContent
      .filter(content => content.featured)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 6);

    return of(featured);
  }

  /**
   * Search content by keywords
   */
  searchContent(query: string): Observable<PreparatoryContent[]> {
    const lowercaseQuery = query.toLowerCase();
    const results = this.mockContent.filter(content =>
      content.title.toLowerCase().includes(lowercaseQuery) ||
      content.description.toLowerCase().includes(lowercaseQuery) ||
      content.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );

    return of(results);
  }

  /**
   * Get content by specific tech track
   */
  getContentByTrack(techTrack: TechTrack): Observable<PreparatoryContent[]> {
    const trackContent = this.mockContent.filter(content => content.techTrack === techTrack);
    return of(trackContent);
  }
}
