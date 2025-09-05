import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Voyage } from '../../../models/voyage.model';
import { Island } from '../../../models/island.model';
import { Deck, SessionType } from '../../../models/venue.model';
import { AdminService } from '../../../services/admin/admin.service';

@Component({
  selector: 'app-admin-voyage-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-voyage-management.component.html',
  styleUrl: './admin-voyage-management.component.scss'
})
export class AdminVoyageManagementComponent implements OnInit, OnDestroy {
  private adminService = inject(AdminService);
  private destroy$ = new Subject<void>();

  // Voyages data from Firebase
  readonly voyages = signal<Voyage[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);

  // Modal and form states
  readonly showCreateModal = signal(false);
  readonly showEditModal = signal(false);
  readonly selectedVoyage = signal<Voyage | null>(null);

  // Voyage form data
  readonly voyageForm = signal({
    name: '',
    date: ''
  });

  // Island management states
  readonly showCreateIslandModal = signal(false);
  readonly showEditIslandModal = signal(false);
  readonly selectedIsland = signal<Island | null>(null);
  readonly selectedVoyageForIslands = signal<Voyage | null>(null);
  readonly voyageIslands = signal<Island[]>([]);

  // Accordion states
  readonly expandedVoyages = signal<Set<string>>(new Set());

  // Island form data
  readonly islandForm = signal({
    title: '',
    speaker: '',
    speakerRole: '',
    speakerCompany: '',
    time: '',
    duration: '',
    venue: Deck.ALPHA,
    sessionType: SessionType.BREAKOUT,
    description: '',
    tags: [] as string[],
    attended: false
  });

  // Available options for forms
  readonly deckOptions = Object.values(Deck);
  readonly sessionTypeOptions = Object.values(SessionType);

  ngOnInit(): void {
    this.loadVoyages();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load all voyages from Firebase
   */
  loadVoyages(): void {
    this.loading.set(true);
    this.error.set(null);

    this.adminService.getAllVoyages()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (voyages) => {
          this.voyages.set(voyages);
          this.loading.set(false);
        },
        error: (error) => {
          this.error.set(error.message);
          this.loading.set(false);
          console.error('Failed to load voyages:', error);
        }
      });
  }

  /**
   * VOYAGE CRUD OPERATIONS
   */

  // Create new voyage
  createVoyage(): void {
    this.resetVoyageForm();
    this.showCreateModal.set(true);
  }

  // Edit existing voyage
  editVoyage(voyage: Voyage): void {
    this.selectedVoyage.set(voyage);
    this.voyageForm.set({
      name: voyage.name,
      date: voyage.date
    });
    this.showEditModal.set(true);
  }

  // Save voyage (create or update)
  saveVoyage(): void {
    const form = this.voyageForm();

    if (!form.name.trim() || !form.date) {
      this.error.set('Please fill in all required fields');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    if (this.showCreateModal()) {
      // Create new voyage
      this.adminService.createVoyage({
        name: form.name.trim(),
        date: form.date,
        islands: []
      })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (voyageId) => {
            console.log('Voyage created with ID:', voyageId);
            this.showCreateModal.set(false);
            this.resetVoyageForm();
            this.loadVoyages(); // Reload data
          },
          error: (error) => {
            this.error.set(error.message);
            this.loading.set(false);
          }
        });

    } else if (this.showEditModal()) {
      // Update existing voyage
      const voyageId = this.selectedVoyage()?.id;
      if (voyageId) {
        this.adminService.updateVoyage(voyageId, {
          name: form.name.trim(),
          date: form.date
        })
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.showEditModal.set(false);
              this.selectedVoyage.set(null);
              this.resetVoyageForm();
              this.loadVoyages(); // Reload data
            },
            error: (error) => {
              this.error.set(error.message);
              this.loading.set(false);
            }
          });
      }
    }
  }

  // Delete voyage
  deleteVoyage(voyageId: string): void {
    if (confirm('Are you sure you want to delete this voyage? This action cannot be undone. All islands in this voyage will also be deleted.')) {
      this.loading.set(true);
      this.error.set(null);

      this.adminService.deleteVoyage(voyageId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadVoyages(); // Reload data
          },
          error: (error) => {
            this.error.set(error.message);
            this.loading.set(false);
          }
        });
    }
  }

  /**
   * ISLAND CRUD OPERATIONS
   */

  // Manage islands for a voyage
  manageIslands(voyage: Voyage): void {
    this.selectedVoyageForIslands.set(voyage);
    this.loadIslands(voyage.id);
  }

  // Load islands for selected voyage
  private loadIslands(voyageId: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.adminService.getIslandsByVoyage(voyageId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (islands) => {
          this.voyageIslands.set(islands);
          this.loading.set(false);
        },
        error: (error) => {
          this.error.set(error.message);
          this.loading.set(false);
        }
      });
  }

  // Create new island
  createIsland(): void {
    this.resetIslandForm();
    this.showCreateIslandModal.set(true);
  }

  // Edit existing island
  editIsland(island: Island, voyage: Voyage): void {
    this.selectedIsland.set(island);
    this.selectedVoyageForIslands.set(voyage); // Set the voyage context for island editing
    this.islandForm.set({
      title: island.title,
      speaker: island.speaker,
      speakerRole: island.speakerRole,
      speakerCompany: island.speakerCompany,
      time: island.time,
      duration: island.duration,
      venue: island.venue,
      sessionType: island.sessionType,
      description: island.description,
      tags: [...island.tags],
      attended: island.attended
    });
    this.showEditIslandModal.set(true);
  }

  // Save island (create or update)
  saveIsland(): void {
    const form = this.islandForm();
    const voyageId = this.selectedVoyageForIslands()?.id;

    if (!voyageId) {
      this.error.set('No voyage selected');
      return;
    }

    if (!form.title.trim() || !form.speaker.trim() || !form.time) {
      this.error.set('Please fill in all required fields');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    if (this.showCreateIslandModal()) {
      // Create new island
      this.adminService.createIsland(voyageId, {
        title: form.title.trim(),
        speaker: form.speaker.trim(),
        speakerRole: form.speakerRole.trim(),
        speakerCompany: form.speakerCompany.trim(),
        time: form.time,
        duration: form.duration,
        venue: form.venue,
        sessionType: form.sessionType,
        description: form.description.trim(),
        tags: form.tags,
        attended: form.attended
      })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (islandId) => {
            console.log('Island created with ID:', islandId);
            this.showCreateIslandModal.set(false);
            this.resetIslandForm();
            this.loadIslands(voyageId); // Reload islands
          },
          error: (error) => {
            this.error.set(error.message);
            this.loading.set(false);
          }
        });

    } else if (this.showEditIslandModal()) {
      // Update existing island
      const islandId = this.selectedIsland()?.id;
      if (islandId) {
        this.adminService.updateIsland(voyageId, islandId, {
          title: form.title.trim(),
          speaker: form.speaker.trim(),
          speakerRole: form.speakerRole.trim(),
          speakerCompany: form.speakerCompany.trim(),
          time: form.time,
          duration: form.duration,
          venue: form.venue,
          sessionType: form.sessionType,
          description: form.description.trim(),
          tags: form.tags,
          attended: form.attended
        })
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.showEditIslandModal.set(false);
              this.selectedIsland.set(null);
              this.resetIslandForm();
              this.loadVoyages(); // Reload all voyages to refresh island data in accordion
              this.loading.set(false);
              this.error.set(null);
              this.success.set('Island updated successfully!');
              // Clear success message after 3 seconds
              setTimeout(() => this.success.set(null), 3000);
            },
            error: (error) => {
              this.error.set(error.message);
              this.loading.set(false);
            }
          });
      }
    }
  }

  // Delete island
  deleteIsland(island: Island): void {
    const voyageId = this.selectedVoyageForIslands()?.id;
    if (!voyageId) return;

    if (confirm(`Are you sure you want to delete the island "${island.title}"? This action cannot be undone.`)) {
      this.loading.set(true);
      this.error.set(null);

      this.adminService.deleteIsland(voyageId, island.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadIslands(voyageId); // Reload islands
          },
          error: (error) => {
            this.error.set(error.message);
            this.loading.set(false);
          }
        });
    }
  }

  /**
   * MODAL AND FORM MANAGEMENT
   */

  // Cancel voyage modal
  cancelVoyageModal(): void {
    this.showCreateModal.set(false);
    this.showEditModal.set(false);
    this.selectedVoyage.set(null);
    this.resetVoyageForm();
  }

  // Cancel island modal
  cancelIslandModal(): void {
    this.showCreateIslandModal.set(false);
    this.showEditIslandModal.set(false);
    this.selectedIsland.set(null);
    this.resetIslandForm();
  }

  // Close islands management
  closeIslandsManagement(): void {
    this.selectedVoyageForIslands.set(null);
    this.voyageIslands.set([]);
  }

  // Reset voyage form
  private resetVoyageForm(): void {
    this.voyageForm.set({
      name: '',
      date: ''
    });
  }

  // Reset island form
  private resetIslandForm(): void {
    this.islandForm.set({
      title: '',
      speaker: '',
      speakerRole: '',
      speakerCompany: '',
      time: '',
      duration: '',
      venue: Deck.ALPHA,
      sessionType: SessionType.BREAKOUT,
      description: '',
      tags: [],
      attended: false
    });
  }

  /**
   * UTILITY METHODS
   */

  // Add tag to island form
  addTag(event: any): void {
    const input = event.target;
    const tag = input.value.trim();

    if (tag && event.key === 'Enter') {
      const currentTags = this.islandForm().tags;
      if (!currentTags.includes(tag)) {
        this.islandForm.update(form => ({
          ...form,
          tags: [...currentTags, tag]
        }));
      }
      input.value = '';
    }
  }

  // Remove tag from island form
  removeTag(tagToRemove: string): void {
    this.islandForm.update(form => ({
      ...form,
      tags: form.tags.filter(tag => tag !== tagToRemove)
    }));
  }

  /**
   * ACCORDION FUNCTIONALITY
   */

  /**
   * Toggle voyage accordion expansion
   * @param voyageId The voyage ID to toggle
   */
  toggleVoyageExpansion(voyageId: string): void {
    const currentExpanded = this.expandedVoyages();
    const newExpanded = new Set(currentExpanded);

    if (newExpanded.has(voyageId)) {
      newExpanded.delete(voyageId);
    } else {
      newExpanded.add(voyageId);
      // Load islands for this voyage if not already loaded
      this.loadVoyageIslands(voyageId);
    }

    this.expandedVoyages.set(newExpanded);
  }

  /**
   * Check if a voyage is expanded
   * @param voyageId The voyage ID to check
   */
  isVoyageExpanded(voyageId: string): boolean {
    return this.expandedVoyages().has(voyageId);
  }

  /**
   * Load islands for a specific voyage (for accordion display)
   * @param voyageId The voyage ID
   */
  loadVoyageIslands(voyageId: string): void {
    const voyage = this.voyages().find(v => v.id === voyageId);
    if (!voyage) return;

    // If islands are already loaded in the voyage object, no need to fetch again
    if (voyage.islands && voyage.islands.length > 0) return;

    this.adminService.getIslandsByVoyage(voyageId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (islands) => {
          // Update the voyage in the voyages array with loaded islands
          const updatedVoyages = this.voyages().map(v =>
            v.id === voyageId ? { ...v, islands } : v
          );
          this.voyages.set(updatedVoyages);
        },
        error: (error) => {
          console.error('Failed to load voyage islands:', error);
        }
      });
  }

  // Format date for display
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
