import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Voyage } from '../../../models/voyage.model';
import { Island } from '../../../models/island.model';
import { Deck, SessionType } from '../../../models/venue.model';
import { AdminService } from '../../../services/admin/admin.service';
import { ToastService } from '../../../services/toast/toast.service';
import { ToastContainerComponent } from '../../../shared/components/toast-container/toast-container.component';

interface IslandWithVoyage extends Island {
  voyageName?: string;
  voyageId?: string;
}

@Component({
  selector: 'app-admin-island-coordination',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastContainerComponent],
  templateUrl: './admin-island-coordination.component.html',
  styleUrl: './admin-island-coordination.component.scss'
})
export class AdminIslandCoordinationComponent implements OnInit, OnDestroy {
  private adminService = inject(AdminService);
  private toastService = inject(ToastService);
  private destroy$ = new Subject<void>();

  // Signals for reactive state management
  islands = signal<IslandWithVoyage[]>([]);
  voyages = signal<Voyage[]>([]);
  filteredIslands = signal<IslandWithVoyage[]>([]);
  isLoading = signal(false);
  showIslandModal = signal(false);
  isEditMode = signal(false);

  // Filter and search states
  searchTerm = signal('');
  selectedVoyageFilter = signal<string>('all');
  selectedSessionTypeFilter = signal<SessionType | 'all'>('all');
  selectedVenueFilter = signal<Deck | 'all'>('all');

  // Current island form data
  currentIsland = signal<Partial<IslandWithVoyage>>({
    title: '',
    speaker: '',
    speakerRole: '',
    speakerCompany: '',
    time: '',
    duration: '',
    venue: Deck.ALPHA,
    sessionType: SessionType.OPENING_WATERS,
    description: '',
    tags: [],
    attended: false
  });

  // Available options
  sessionTypes = Object.values(SessionType);
  venues = Object.values(Deck);

  ngOnInit() {
    this.loadAllData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAllData() {
    this.isLoading.set(true);

    // Load voyages first, then load all islands
    this.adminService.getAllVoyages()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (voyages) => {
          this.voyages.set(voyages);
          this.loadAllIslands();
        },
        error: (error) => {
          console.error('Error loading voyages:', error);
          this.toastService.showError('Failed to load voyages');
          this.isLoading.set(false);
        }
      });
  }

  loadAllIslands() {
    const voyages = this.voyages();
    const allIslands: IslandWithVoyage[] = [];

    voyages.forEach(voyage => {
      if (voyage.islands) {
        voyage.islands.forEach(island => {
          allIslands.push({
            ...island,
            voyageName: voyage.name,
            voyageId: voyage.id
          });
        });
      }
    });

    this.islands.set(allIslands);
    this.applyFilters();
    this.isLoading.set(false);
  }

  applyFilters() {
    const islands = this.islands();
    const searchTerm = this.searchTerm().toLowerCase();
    const voyageFilter = this.selectedVoyageFilter();
    const sessionTypeFilter = this.selectedSessionTypeFilter();
    const venueFilter = this.selectedVenueFilter();

    let filtered = islands;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(island =>
        island.title?.toLowerCase().includes(searchTerm) ||
        island.speaker?.toLowerCase().includes(searchTerm) ||
        island.description?.toLowerCase().includes(searchTerm) ||
        island.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Voyage filter
    if (voyageFilter !== 'all') {
      filtered = filtered.filter(island => island.voyageId === voyageFilter);
    }

    // Session type filter
    if (sessionTypeFilter !== 'all') {
      filtered = filtered.filter(island => island.sessionType === sessionTypeFilter);
    }

    // Venue filter
    if (venueFilter !== 'all') {
      filtered = filtered.filter(island => island.venue === venueFilter);
    }

    this.filteredIslands.set(filtered);
  }

  createIsland() {
    this.resetIslandForm();
    this.isEditMode.set(false);
    this.showIslandModal.set(true);
  }

  editIsland(island: IslandWithVoyage) {
    this.currentIsland.set({
      ...island,
      voyageId: island.voyageId
    });
    this.isEditMode.set(true);
    this.showIslandModal.set(true);
  }

  saveIsland() {
    const islandData = this.currentIsland();
    const voyageId = islandData.voyageId;

    if (!voyageId) {
      this.toastService.showError('Please select a voyage for this island');
      return;
    }

    if (!islandData.title || !islandData.speaker) {
      this.toastService.showError('Please fill in all required fields');
      return;
    }

    const island: Partial<Island> = {
      title: islandData.title,
      speaker: islandData.speaker,
      speakerRole: islandData.speakerRole,
      speakerCompany: islandData.speakerCompany,
      time: islandData.time,
      duration: islandData.duration,
      venue: islandData.venue,
      sessionType: islandData.sessionType,
      description: islandData.description,
      tags: islandData.tags || [],
      attended: islandData.attended || false
    };

    if (this.isEditMode() && islandData.id) {
      // Update existing island
      this.adminService.updateIsland(voyageId, islandData.id, island)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.showSuccess('Island updated successfully');
            this.showIslandModal.set(false);
            this.loadAllData();
          },
          error: (error) => {
            console.error('Error updating island:', error);
            this.toastService.showError('Failed to update island');
          }
        });
    } else {
      // Create new island
      this.adminService.createIsland(voyageId, island as Island)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.showSuccess('Island created successfully');
            this.showIslandModal.set(false);
            this.loadAllData();
          },
          error: (error) => {
            console.error('Error creating island:', error);
            this.toastService.showError('Failed to create island');
          }
        });
    }
  }

  deleteIsland(island: IslandWithVoyage) {
    if (!island.voyageId || !island.id) {
      this.toastService.showError('Invalid island data');
      return;
    }

    if (confirm(`Are you sure you want to delete the island "${island.title}"? This action cannot be undone.`)) {
      this.adminService.deleteIsland(island.voyageId, island.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.showSuccess('Island deleted successfully');
            this.loadAllData();
          },
          error: (error) => {
            console.error('Error deleting island:', error);
            this.toastService.showError('Failed to delete island');
          }
        });
    }
  }

  cancelIslandModal() {
    this.showIslandModal.set(false);
    this.resetIslandForm();
  }

  resetIslandForm() {
    this.currentIsland.set({
      title: '',
      speaker: '',
      speakerRole: '',
      speakerCompany: '',
      time: '',
      duration: '',
      venue: Deck.ALPHA,
      sessionType: SessionType.OPENING_WATERS,
      description: '',
      tags: [],
      attended: false
    });
  }

  onSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
    this.applyFilters();
  }

  onVoyageFilterChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedVoyageFilter.set(target.value);
    this.applyFilters();
  }

  onSessionTypeFilterChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedSessionTypeFilter.set(target.value as SessionType | 'all');
    this.applyFilters();
  }

  onVenueFilterChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedVenueFilter.set(target.value as Deck | 'all');
    this.applyFilters();
  }

  onIslandFormChange(field: keyof Island | 'voyageId', value: any) {
    const current = this.currentIsland();
    this.currentIsland.set({
      ...current,
      [field]: value
    });
  }

  onVoyageIdChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.onIslandFormChange('voyageId', target.value);
  }

  onVenueChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.onIslandFormChange('venue', target.value);
  }

  onSessionTypeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.onIslandFormChange('sessionType', target.value);
  }

  onDescriptionChange(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.onIslandFormChange('description', target.value);
  }

  onInputChange(field: keyof Island, event: Event) {
    const target = event.target as HTMLInputElement;
    this.onIslandFormChange(field, target.value);
  }

  addTag(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      const target = event.target as HTMLInputElement;
      const tag = target.value.trim();

      if (tag) {
        const current = this.currentIsland();
        const tags = current.tags || [];
        if (!tags.includes(tag)) {
          this.currentIsland.set({
            ...current,
            tags: [...tags, tag]
          });
        }
        target.value = '';
      }
    }
  }

  removeTag(tagToRemove: string) {
    const current = this.currentIsland();
    const tags = current.tags || [];
    this.currentIsland.set({
      ...current,
      tags: tags.filter(tag => tag !== tagToRemove)
    });
  }

  formatSessionType(sessionType: string): string {
    return sessionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatVenue(venue: string): string {
    return venue.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}
