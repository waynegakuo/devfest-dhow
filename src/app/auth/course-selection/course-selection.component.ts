import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TechTrack, ExpertiseLevel, CourseSelection } from '../../models/navigator.model';
import { NavigatorService } from '../../services/navigator/navigator.service';

@Component({
  selector: 'app-course-selection',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './course-selection.component.html',
  styleUrl: './course-selection.component.scss'
})
export class CourseSelectionComponent {
  private navigatorService = inject(NavigatorService);
  private router = inject(Router);

  // Available options
  readonly techTracks: TechTrack[] = ['Web Development', 'Mobile Development', 'Cloud & DevOps', 'AI & Machine Learning', 'Game Development', 'UI/UX Design'];
  readonly expertiseLevels: ExpertiseLevel[] = ['Beginner', 'Intermediate', 'Expert'];

  // Form data
  selectedTrack = signal<TechTrack | null>(null);
  selectedExpertise = signal<ExpertiseLevel | null>(null);
  isSubmitting = signal<boolean>(false);

  /**
   * Handles track selection
   */
  selectTrack(track: TechTrack): void {
    this.selectedTrack.set(track);
  }

  /**
   * Handles expertise level selection
   */
  selectExpertise(level: ExpertiseLevel): void {
    this.selectedExpertise.set(level);
  }

  /**
   * Checks if the form is valid for submission
   */
  isFormValid(): boolean {
    return this.selectedTrack() !== null && this.selectedExpertise() !== null;
  }

  /**
   * Submits the course selection
   */
  async onSubmit(): Promise<void> {
    if (!this.isFormValid()) {
      return;
    }

    this.isSubmitting.set(true);

    try {
      const courseSelection: CourseSelection = {
        techTrack: this.selectedTrack()!,
        expertiseLevel: this.selectedExpertise()!
      };

      await this.navigatorService.saveCourseSelection(courseSelection);

      // Navigate to the main dashboard or home page
      this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('Error saving course selection:', error);
      // TODO: Add proper error handling/notification
    } finally {
      this.isSubmitting.set(false);
    }
  }

  /**
   * Skips course selection for now
   */
  skipForNow(): void {
    // Navigate to main app without saving preferences
    this.router.navigate(['/']);
  }
}
