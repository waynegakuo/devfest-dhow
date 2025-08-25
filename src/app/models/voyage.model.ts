import { Island } from './island.model';

export interface Voyage {
  id: string;
  name: string;
  date: string;
  islands: Island[];
}
