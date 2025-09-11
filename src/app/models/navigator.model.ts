export type TechTrack = 'AI/ML' | 'Cloud' | 'Web' | 'Mobile' | 'Web Development' | 'Mobile Development' | 'Cloud & DevOps' | 'AI & Machine Learning' | 'Game Development' | 'UI/UX Design';
export type ExpertiseLevel = 'Beginner' | 'Intermediate' | 'Expert';
export type NavigatorRole = 'navigator' | 'admin';

export interface Navigator {
  id: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  techTrack: TechTrack | null;
  expertiseLevel: ExpertiseLevel | null;
  hasCompletedCourseSelection: boolean;
  role: NavigatorRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseSelection {
  techTrack: TechTrack;
  expertiseLevel: ExpertiseLevel;
}
