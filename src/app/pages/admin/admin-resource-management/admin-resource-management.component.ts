import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { ResourceManagementService, ResourceUploadData } from '../../../services/resource-management/resource-management.service';
import { PreparatoryContent, ContentType } from '../../../models/preparatory-content.model';
import { TechTrack, ExpertiseLevel, Track } from '../../../models/navigator.model';

@Component({
  selector: 'app-admin-resource-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-resource-management.component.html',
  styleUrl: './admin-resource-management.component.scss'
})
export class AdminResourceManagementComponent implements OnInit, OnDestroy {
  private resourceService = inject(ResourceManagementService);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  // Component signals
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  resources = signal<PreparatoryContent[]>([]);
  tracks = signal<Track[]>([]);
  trackCounts = signal<{ track: TechTrack; count: number }[]>([]);
  selectedTrack = signal<TechTrack | null>(null);
  showForm = signal(false);
  editingResource = signal<PreparatoryContent | null>(null);

  // Form
  resourceForm!: FormGroup;

  readonly contentTypes: ContentType[] = [
    'documentation',
    'article',
    'video',
    'tutorial',
    'guide'
  ];

  readonly expertiseLevels: ExpertiseLevel[] = [
    'Beginner',
    'Intermediate',
    'Expert'
  ];

  ngOnInit(): void {
    this.initializeForm();
    this.loadTracks();
    this.loadTrackCounts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.resourceForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      type: ['', Validators.required],
      url: ['', [Validators.required, Validators.pattern('https?://.+')]],
      techTrack: ['', Validators.required],
      expertiseLevel: this.fb.array([], Validators.required),
      duration: [''],
      author: [''],
      source: [''],
      tags: [''],
      featured: [false]
    });
  }

  get expertiseLevelControls() {
    return this.resourceForm.get('expertiseLevel') as FormArray;
  }

  private loadTracks(): void {
    this.loading.set(true);
    this.error.set(null);

    this.resourceService.getAllTracks()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tracks) => {
          this.tracks.set(tracks);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Failed to load tracks');
          this.loading.set(false);
          console.error('Error loading tracks:', err);
        }
      });
  }

  private loadTrackCounts(): void {
    this.loading.set(true);
    this.error.set(null);

    this.resourceService.getTracksWithResourceCounts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (counts) => {
          this.trackCounts.set(counts);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Failed to load track counts');
          this.loading.set(false);
          console.error('Error loading track counts:', err);
        }
      });
  }

  loadResourcesForTrack(track: TechTrack): void {
    this.selectedTrack.set(track);
    this.loading.set(true);
    this.error.set(null);

    this.resourceService.getResourcesByTrack(track)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resources) => {
          this.resources.set(resources);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Failed to load resources');
          this.loading.set(false);
          console.error('Error loading resources:', err);
        }
      });
  }

  toggleForm(): void {
    this.showForm.set(!this.showForm());
    this.editingResource.set(null);
    if (this.showForm()) {
      this.resourceForm.reset();
      this.expertiseLevelControls.clear();
    }
  }

  editResource(resource: PreparatoryContent): void {
    this.editingResource.set(resource);
    this.showForm.set(true);

    // Populate form with resource data
    this.resourceForm.patchValue({
      title: resource.title,
      description: resource.description,
      type: resource.type,
      url: resource.url,
      techTrack: resource.techTrack,
      duration: resource.duration || '',
      author: resource.author || '',
      source: resource.source || '',
      tags: resource.tags.join(', '),
      featured: resource.featured
    });

    // Set expertise levels
    this.expertiseLevelControls.clear();
    resource.expertiseLevel.forEach(level => {
      this.expertiseLevelControls.push(this.fb.control(level));
    });
  }

  onExpertiseLevelChange(level: ExpertiseLevel, checked: boolean): void {
    const controls = this.expertiseLevelControls;

    if (checked) {
      controls.push(this.fb.control(level));
    } else {
      const index = controls.controls.findIndex(control => control.value === level);
      if (index >= 0) {
        controls.removeAt(index);
      }
    }
  }

  isExpertiseLevelSelected(level: ExpertiseLevel): boolean {
    return this.expertiseLevelControls.controls.some(control => control.value === level);
  }

  submitResource(): void {
    if (this.resourceForm.invalid) {
      this.markFormGroupTouched(this.resourceForm);
      return;
    }

    const formValue = this.resourceForm.value;
    const resourceData: ResourceUploadData = {
      title: formValue.title,
      description: formValue.description,
      type: formValue.type,
      url: formValue.url,
      techTrack: formValue.techTrack,
      expertiseLevel: this.expertiseLevelControls.value,
      duration: formValue.duration || undefined,
      author: formValue.author || undefined,
      source: formValue.source || undefined,
      tags: formValue.tags ? formValue.tags.split(',').map((tag: string) => tag.trim()) : [],
      featured: formValue.featured
    };

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    if (this.editingResource()) {
      // Update existing resource
      const track = this.editingResource()!.techTrack;
      const resourceId = this.editingResource()!.id;

      this.resourceService.updateResource(track, resourceId, resourceData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.success.set('Resource updated successfully!');
            this.loading.set(false);
            this.showForm.set(false);
            this.editingResource.set(null);
            this.loadResourcesForTrack(track);
            this.loadTrackCounts();
          },
          error: (err) => {
            this.error.set('Failed to update resource');
            this.loading.set(false);
            console.error('Error updating resource:', err);
          }
        });
    } else {
      // Create new resource
      this.resourceService.uploadResource(resourceData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (resourceId) => {
            this.success.set('Resource uploaded successfully!');
            this.loading.set(false);
            this.showForm.set(false);
            this.resourceForm.reset();
            this.expertiseLevelControls.clear();

            // Reload resources if we're viewing the same track
            if (this.selectedTrack() === resourceData.techTrack) {
              this.loadResourcesForTrack(resourceData.techTrack);
            }
            this.loadTrackCounts();
          },
          error: (err) => {
            this.error.set('Failed to upload resource');
            this.loading.set(false);
            console.error('Error uploading resource:', err);
          }
        });
    }
  }

  deleteResource(resource: PreparatoryContent): void {
    if (!confirm(`Are you sure you want to delete "${resource.title}"?`)) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.resourceService.deleteResource(resource.techTrack, resource.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.success.set('Resource deleted successfully!');
          this.loading.set(false);
          this.loadResourcesForTrack(resource.techTrack);
          this.loadTrackCounts();
        },
        error: (err) => {
          this.error.set('Failed to delete resource');
          this.loading.set(false);
          console.error('Error deleting resource:', err);
        }
      });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Get content type icon
  getContentTypeIcon(type: ContentType): string {
    switch (type) {
      case 'documentation': return '📖';
      case 'article': return '📄';
      case 'video': return '🎥';
      case 'tutorial': return '🎓';
      case 'guide': return '📋';
      default: return '📚';
    }
  }

  // Get track icon
  getTrackIcon(track: TechTrack): string {
    const trackData = this.tracks().find(t => t.name === track);
    return trackData?.icon || '⚡';
  }

  // Clear messages
  clearMessages(): void {
    this.error.set(null);
    this.success.set(null);
  }
}
