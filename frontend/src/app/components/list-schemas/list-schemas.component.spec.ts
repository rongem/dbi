import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import { ListSchemasComponent } from './list-schemas.component';
import { AppStore } from '../../lib/store/app-store.service';

describe('ListSchemasComponent', () => {
  let fixture: ComponentFixture<ListSchemasComponent>;
  const store = {
    schemas: signal(['public', 'sales']),
  };
  const router = {
    navigateByUrl: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListSchemasComponent],
      providers: [
        { provide: AppStore, useValue: store },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { params: {} } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ListSchemasComponent);
    fixture.detectChanges();
  });

  it('renders the available schemas in the UI', () => {
    const native = fixture.nativeElement as HTMLElement;
    expect(native.textContent).toContain('public');
    expect(native.textContent).toContain('sales');
  });

  it('redirects when there is only a single schema', () => {
    store.schemas.set(['sales']);
    fixture.detectChanges();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/schema/sales', { replaceUrl: true });
  });
});
