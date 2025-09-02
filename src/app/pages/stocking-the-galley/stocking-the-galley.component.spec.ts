import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockingTheGalleyComponent } from './stocking-the-galley.component';

describe('StockingTheGalleyComponent', () => {
  let component: StockingTheGalleyComponent;
  let fixture: ComponentFixture<StockingTheGalleyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockingTheGalleyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StockingTheGalleyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
