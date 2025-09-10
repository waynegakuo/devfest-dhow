import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminNavigatorManagementComponent } from './admin-navigator-management.component';

describe('AdminNavigatorManagementComponent', () => {
  let component: AdminNavigatorManagementComponent;
  let fixture: ComponentFixture<AdminNavigatorManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminNavigatorManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminNavigatorManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
