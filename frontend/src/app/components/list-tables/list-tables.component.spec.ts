import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { computed, signal } from '@angular/core';
import { of } from 'rxjs';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import { ListTablesComponent } from './list-tables.component';
import { AppStore } from '../../lib/store/app-store.service';

describe('ListTablesComponent', () => {
  let fixture: ComponentFixture<ListTablesComponent>;
  const store = {
    schemas: signal(['public', 'sales']),
    tableNamesForSchema: vi.fn((schema: string) => computed(() =>
      schema === 'sales' ? ['customers', 'orders'] : ['users']))
  };
  const router = { navigateByUrl: vi.fn() };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListTablesComponent, RouterTestingModule],
      providers: [
        { provide: AppStore, useValue: store },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { params: of({ schema: 'sales' }) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ListTablesComponent);
    fixture.detectChanges();
  });

  it('keeps the current schema in sync with the route', () => {
    const component = fixture.componentInstance;
    expect(component.schemaName).toBe('sales');
  });

  it('lists tables for the selected schema', () => {
    const native = fixture.nativeElement as HTMLElement;
    expect(native.textContent).toContain('customers');
    expect(native.textContent).toContain('orders');
  });
});
