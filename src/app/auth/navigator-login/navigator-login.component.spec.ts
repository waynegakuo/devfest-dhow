import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavigatorLoginComponent } from './navigator-login.component';

describe('NavigatorLoginComponent', () => {
  let component: NavigatorLoginComponent;
  let fixture: ComponentFixture<NavigatorLoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavigatorLoginComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavigatorLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
