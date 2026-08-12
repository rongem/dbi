import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';

import { ErrorBadgeComponent } from './error-badge.component';

describe('ErrorBadgeComponent', () => {
  let fixture: ComponentFixture<ErrorBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorBadgeComponent);
    fixture.componentRef.setInput('errorDescription', 'Missing value');
    fixture.detectChanges();
  });

  it('starts with the error details hidden', () => {
    const native = fixture.nativeElement as HTMLElement;
    expect(native.textContent).not.toContain('Missing value');
  });

  it('shows the error description when the badge is expanded', () => {
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();

    const native = fixture.nativeElement as HTMLElement;
    expect(native.textContent).toContain('Missing value');
  });
});
