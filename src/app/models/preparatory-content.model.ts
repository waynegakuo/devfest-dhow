import { TechTrack, ExpertiseLevel } from './navigator.model';

export type ContentType = 'documentation' | 'article' | 'video' | 'tutorial' | 'guide';

export interface PreparatoryContent {
  id: string;
  title: string;
  description: string;
  type: ContentType;
  url: string;
  techTrack: TechTrack;
  expertiseLevel: ExpertiseLevel[];
  duration?: string; // For videos and tutorials
  author?: string;
  source?: string; // e.g., 'Google Developers', 'Medium', 'YouTube'
  tags: string[];
  featured: boolean;
  createdAt: Date;
}

export interface PreparatoryContentSection {
  title: string;
  description: string;
  items: PreparatoryContent[];
}

export interface CuratedContent {
  trackName: string;
  expertiseLevel: ExpertiseLevel;
  sections: PreparatoryContentSection[];
  totalItems: number;
}
