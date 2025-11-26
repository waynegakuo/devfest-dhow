export enum Deck {
  ALPHA = 'Alpha Deck',
  BRAVO = 'Bravo Deck',
  CHARLIE = 'Charlie Deck',
  DELTA = 'Delta Deck',
  AUDITORIUM = 'Auditorium'
}

export enum SessionType {
  OPENING_WATERS = 'Opening Waters', // Keynote sessions
  BREAKOUT = 'Breakout',
  LUNCH = 'Lunch',
  GROUP_PHOTO = 'Group Photo',
  CLOSING_CEREMONY = 'Closing Ceremony'
}

export interface VenueSchedule {
  deck: Deck;
  sessionType: SessionType;
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface ScheduleConstraints {
  // Morning keynotes: 9AM - 11:30AM on Alpha Deck only
  keynoteStart: string;
  keynoteEnd: string;
  keynoteDeck: Deck;

  // Breakout sessions: 12PM - 5PM on all decks
  breakoutStart: string;
  breakoutEnd: string;
  breakoutSessionDuration: number; // 40 minutes
  breakoutTransitionTime: number; // 10 minutes

  // Lunch: 1PM - 2PM (first 15 minutes for group photo)
  lunchStart: string;
  lunchEnd: string;
  groupPhotoStart: string;
  groupPhotoDuration: number; // 15 minutes

  // Closing: 5PM on Alpha Deck
  closingStart: string;
  closingDeck: Deck;
}

// Default schedule configuration
export const DEFAULT_SCHEDULE_CONSTRAINTS: ScheduleConstraints = {
  keynoteStart: '09:00',
  keynoteEnd: '11:30',
  keynoteDeck: Deck.ALPHA,

  breakoutStart: '12:00',
  breakoutEnd: '17:00',
  breakoutSessionDuration: 40,
  breakoutTransitionTime: 10,

  lunchStart: '13:00',
  lunchEnd: '14:00',
  groupPhotoStart: '13:00',
  groupPhotoDuration: 15,

  closingStart: '17:00',
  closingDeck: Deck.ALPHA
};
