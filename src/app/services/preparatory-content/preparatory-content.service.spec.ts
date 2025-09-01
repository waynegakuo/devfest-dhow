import { TestBed } from '@angular/core/testing';

import { PreparatoryContentService } from './preparatory-content.service';

describe('PreparatoryContentService', () => {
  let service: PreparatoryContentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PreparatoryContentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
