import { Island } from './island.model';

export interface VoyagePlanItem {
  island: Island;
  voyageId: string;
  voyageName: string;
  voyageDate: string; // ISO-like date string, e.g., '2025-02-15'
}
