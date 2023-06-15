import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ErrorBadgeComponent } from './error-badge.component';

describe('ErrorBadgeComponent', () => {
  let component: ErrorBadgeComponent;
  let fixture: ComponentFixture<ErrorBadgeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ErrorBadgeComponent]
    });
    fixture = TestBed.createComponent(ErrorBadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
