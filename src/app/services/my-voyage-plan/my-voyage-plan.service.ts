import { Injectable, Signal, WritableSignal, computed, inject, signal } from '@angular/core';
import { VoyagePlanItem } from '../../models/voyage-plan.model';

@Injectable({ providedIn: 'root' })
export class MyVoyagePlanService {
  private storageKey = 'devfest-dhow-my-voyage-plan-v1';

  private itemsSignal: WritableSignal<VoyagePlanItem[]> = signal<VoyagePlanItem[]>(this.safeLoad());

  readonly items: Signal<VoyagePlanItem[]> = this.itemsSignal.asReadonly();

  readonly itemsSorted: Signal<VoyagePlanItem[]> = computed(() => {
    return [...this.itemsSignal()].sort((a, b) => {
      // Sort by date then time (HH:mm)
      const aDateTime = `${a.voyageDate}T${a.island.time}`;
      const bDateTime = `${b.voyageDate}T${b.island.time}`;
      return aDateTime.localeCompare(bDateTime);
    });
  });

  addSession(item: VoyagePlanItem): void {
    if (this.isInPlan(item.island.id)) return;
    const next = [...this.itemsSignal(), item];
    this.itemsSignal.set(next);
    this.safeSave(next);
  }

  removeSession(islandId: string): void {
    const next = this.itemsSignal().filter(i => i.island.id !== islandId);
    this.itemsSignal.set(next);
    this.safeSave(next);
  }

  toggleSession(item: VoyagePlanItem): void {
    if (this.isInPlan(item.island.id)) {
      this.removeSession(item.island.id);
    } else {
      this.addSession(item);
    }
  }

  clear(): void {
    this.itemsSignal.set([]);
    this.safeSave([]);
  }

  isInPlan(islandId: string): boolean {
    return this.itemsSignal().some(i => i.island.id === islandId);
  }

  private safeLoad(): VoyagePlanItem[] {
    try {
      if (typeof window === 'undefined') return [];
      const raw = window.localStorage.getItem(this.storageKey);
      return raw ? (JSON.parse(raw) as VoyagePlanItem[]) : [];
    } catch {
      return [];
    }
  }

  private safeSave(items: VoyagePlanItem[]): void {
    try {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem(this.storageKey, JSON.stringify(items));
    } catch {
      // ignore storage errors
    }
  }
}
