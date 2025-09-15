import { Component, Input, Output, EventEmitter, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigatorService } from '../../../services/navigator/navigator.service';

export interface OceanTerminology {
  term: string;
  emoji: string;
  meaning: string;
}

@Component({
  selector: 'app-help-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './help-popup.component.html',
  styleUrl: './help-popup.component.scss'
})
export class HelpPopupComponent {
  @Input() isVisible: boolean = false;
  @Output() close = new EventEmitter<void>();

  private navigatorService = inject(NavigatorService);

  // Get current navigator data
  readonly navigator = this.navigatorService.currentNavigator.asReadonly();

  // Check if current user is admin
  readonly isAdmin = computed(() => {
    const nav = this.navigator();
    return nav?.role === 'admin';
  });

  // All ocean terminology terms
  private allOceanTerminology: OceanTerminology[] = [
    { term: 'Navigators', emoji: '🧭', meaning: 'Users/attendees of the DevFest conference' },
    { term: 'Voyages', emoji: '🛳️', meaning: 'Conference tracks and learning paths' },
    { term: 'Islands', emoji: '🏝️', meaning: 'Individual sessions, talks, and workshops' },
    { term: 'The Helm', emoji: '⚓', meaning: 'Dashboard/control center for managing your conference experience' },
    { term: 'Ports', emoji: '🏖️', meaning: 'Venues and locations within the conference' },
    { term: 'Compass', emoji: '🧭', meaning: 'Navigation components and schedule finder' },
    { term: 'Anchor', emoji: '⚓', meaning: 'Fixed or persistent elements and important information' },
    { term: 'Home Port', emoji: '🏠', meaning: 'Main homepage of the DevFest Dhow application' },
    { term: 'Admiral\'s Helm', emoji: '👑', meaning: 'Administrative dashboard for conference organizers' },
    { term: 'Stocking the Galley', emoji: '📦', meaning: 'Resource preparation and conference materials' },
    { term: 'Cast Off', emoji: '🚀', meaning: 'Start or begin an activity or session' },
    { term: 'Drop Anchor', emoji: '⚓', meaning: 'Save, bookmark, or mark important items' },
    { term: 'Chart Course', emoji: '🗺️', meaning: 'Plan your conference schedule and learning path' },
    { term: 'Fair Winds', emoji: '⛵', meaning: 'Good luck and successful conference experience' }
  ];

  // Filtered ocean terminology based on user role
  readonly oceanTerminology = computed(() => {
    if (this.isAdmin()) {
      return this.allOceanTerminology;
    } else {
      return this.allOceanTerminology.filter(term => term.term !== 'Admiral\'s Helm');
    }
  });

  onBackdropClick(): void {
    this.close.emit();
  }

  onPopupClick(event: Event): void {
    event.stopPropagation();
  }

  closePopup(): void {
    this.close.emit();
  }
}
