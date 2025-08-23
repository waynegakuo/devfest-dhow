import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompassNavComponent } from './compass-nav.component';

describe('CompassNavComponent', () => {
  let component: CompassNavComponent;
  let fixture: ComponentFixture<CompassNavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompassNavComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompassNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
