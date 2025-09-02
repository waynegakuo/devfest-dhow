import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NavigatorService } from '../../services/navigator/navigator.service';
import { PreparatoryContentService } from '../../services/preparatory-content/preparatory-content.service';
import { CuratedContent, PreparatoryContent, PreparatoryContentSection } from '../../models/preparatory-content.model';
import { TechTrack, ExpertiseLevel } from '../../models/navigator.model';

@Component({
  selector: 'app-stocking-the-galley',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stocking-the-galley.component.html',
  styleUrl: './stocking-the-galley.component.scss'
})
export class StockingTheGalleyComponent implements OnInit {
  private navigatorService = inject(NavigatorService);
  private preparatoryContentService = inject(PreparatoryContentService);
  private router = inject(Router);

  // Component state
  navigator = this.navigatorService.currentNavigator;
  curatedContent = signal<CuratedContent | null>(null);
  featuredContent = signal<PreparatoryContent[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    // Initialize navigator data and then load content
    this.navigatorService.getNavigator().subscribe({
      next: (navigator) => {
        if (navigator) {
          this.loadContent();
        } else {
          this.error.set('Navigator data not available');
        }
      },
      error: (err) => {
        console.error('Error loading navigator:', err);
        this.error.set('Failed to load navigator data');
      }
    });
  }

  loadContent(): void {
    const currentNavigator = this.navigator();

    if (!currentNavigator) {
      this.error.set('Navigator data not available');
      return;
    }

    if (!currentNavigator.techTrack || !currentNavigator.expertiseLevel) {
      // User hasn't completed course selection, redirect them
      this.router.navigate(['/chart-course']);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    // Load curated content based on user's track and expertise level
    this.preparatoryContentService.getCuratedContent(
      currentNavigator.techTrack,
      currentNavigator.expertiseLevel
    ).subscribe({
      next: (content) => {
        this.curatedContent.set(content);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load preparatory content');
        this.loading.set(false);
        console.error('Error loading curated content:', err);
      }
    });

    // Load featured content
    this.preparatoryContentService.getFeaturedContent().subscribe({
      next: (featured) => {
        this.featuredContent.set(featured);
      },
      error: (err) => {
        console.error('Error loading featured content:', err);
      }
    });
  }

  // Get content type icon
  getContentTypeIcon(type: string): string {
    switch (type) {
      case 'documentation': return '📖';
      case 'article': return '📄';
      case 'video': return '🎥';
      case 'tutorial': return '🎓';
      case 'guide': return '📋';
      default: return '📚';
    }
  }

  // Get expertise level display name
  getExpertiseLevelDisplay(level: ExpertiseLevel): string {
    switch (level) {
      case 'Beginner': return 'Beginner Navigator';
      case 'Intermediate': return 'Seasoned Navigator';
      case 'Expert': return 'Master Navigator';
      default: return level;
    }
  }

  // Open external link
  openLink(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  // Navigate to course selection if user needs to set preferences
  goToChartCourse(): void {
    this.router.navigate(['/chart-course']);
  }
}
