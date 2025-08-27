export type TechTrack = 'AI/ML' | 'Cloud' | 'Web' | 'Mobile';
export type ExpertiseLevel = 'Beginner' | 'Intermediate' | 'Expert';

export interface Navigator {
  id: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  techTrack: TechTrack | null;
  expertiseLevel: ExpertiseLevel | null;
  hasCompletedCourseSelection: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseSelection {
  techTrack: TechTrack;
  expertiseLevel: ExpertiseLevel;
}
