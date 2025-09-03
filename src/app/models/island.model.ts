import { Deck, SessionType } from './venue.model';

export interface Island {
  id: string;
  title: string;
  speaker: string;
  speakerRole: string;
  speakerCompany: string;
  time: string;
  duration: string;
  venue: Deck;
  sessionType: SessionType;
  description: string;
  tags: string[];
  attended: boolean;
}
