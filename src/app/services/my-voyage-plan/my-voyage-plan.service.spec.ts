import { MyVoyagePlanService } from './my-voyage-plan.service';
import { VoyagePlanItem } from '../../models/voyage-plan.model';

// Simple in-memory mock for localStorage to avoid cross-test persistence
class MockStorage {
  private store = new Map<string, string>();
  getItem(key: string) { return this.store.get(key) ?? null; }
  setItem(key: string, value: string) { this.store.set(key, value); }
  removeItem(key: string) { this.store.delete(key); }
  clear() { this.store.clear(); }
}

describe('MyVoyagePlanService', () => {
  let service: MyVoyagePlanService;
  let storage: MockStorage;
  const STORAGE_KEY = 'devfest-dhow-my-voyage-plan-v1';

  const makeItem = (id: string, time: string, date = '2025-02-15'): VoyagePlanItem => ({
    island: {
      id,
      title: `Island ${id}`,
      speaker: 'Speaker',
      speakerRole: 'Role',
      speakerCompany: 'Company',
      time,
      duration: '30 min',
      venue: 'Main Deck',
      description: 'Desc',
      tags: [],
      attended: false,
    },
    voyageId: 'v1',
    voyageName: 'Voyage 1',
    voyageDate: date,
  });

  beforeEach(() => {
    // Spy on window.localStorage with our mock
    storage = new MockStorage();
    spyOnProperty(window as any, 'localStorage', 'get').and.returnValue(storage as any);
    service = new MyVoyagePlanService();
  });

  it('should start empty', () => {
    expect(service.items().length).toBe(0);
  });

  it('should add a session and persist', () => {
    const item = makeItem('i1', '09:00');
    service.addSession(item);
    expect(service.items().length).toBe(1);
    expect(JSON.parse(storage.getItem(STORAGE_KEY)!).length).toBe(1);
  });

  it('should not add duplicate sessions', () => {
    const item = makeItem('i1', '09:00');
    service.addSession(item);
    service.addSession(item);
    expect(service.items().length).toBe(1);
  });

  it('should toggle add/remove session', () => {
    const item = makeItem('i2', '10:00');
    service.toggleSession(item);
    expect(service.isInPlan('i2')).toBeTrue();
    service.toggleSession(item);
    expect(service.isInPlan('i2')).toBeFalse();
  });

  it('should remove session', () => {
    const item = makeItem('i3', '11:00');
    service.addSession(item);
    service.removeSession('i3');
    expect(service.items().length).toBe(0);
  });

  it('should sort sessions chronologically by date and time', () => {
    const a = makeItem('a', '12:00', '2025-02-15');
    const b = makeItem('b', '09:00', '2025-02-16');
    const c = makeItem('c', '08:00', '2025-02-15');
    service.addSession(a);
    service.addSession(b);
    service.addSession(c);
    const sorted = service.itemsSorted();
    expect(sorted[0].island.id).toBe('c'); // 15th 08:00
    expect(sorted[1].island.id).toBe('a'); // 15th 12:00
    expect(sorted[2].island.id).toBe('b'); // 16th 09:00
  });
});
