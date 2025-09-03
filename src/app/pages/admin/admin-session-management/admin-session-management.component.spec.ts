import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminSessionManagementComponent } from './admin-session-management.component';

describe('AdminSessionManagementComponent', () => {
  let component: AdminSessionManagementComponent;
  let fixture: ComponentFixture<AdminSessionManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminSessionManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminSessionManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
