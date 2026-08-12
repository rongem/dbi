import { NO_ERRORS_SCHEMA, computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import { TableComponent } from './table.component';
import { AppStore } from '../../lib/store/app-store.service';
import { ToastService } from '../../lib/services/toast.service';

describe('TableComponent', () => {
  let fixture: ComponentFixture<TableComponent>;
  let component: TableComponent;

  const columnDefinitionMock = {
    ordinalPosition: 1,
    name: 'amount',
    primary: false,
    foreignKey: false,
    unique: false,
    hasDefaultValue: false,
    isNullable: false,
    typeInfo: { allowedTypes: ['number'] },
    constraints: {
      logicalTypes: ['number'],
      number: { minimum: 0, maximum: 100 },
      enumValues: [10, 25],
    },
  };

  const store = {
    schemas: signal(['public']),
    tables: signal([{ schema: 'public', name: 'orders' }]),
    columnDefinitions: signal([columnDefinitionMock]),
    rowNumbers: signal([0]),
    tableContainsErrors: signal(false),
    cellInformations: signal([]),
    columnMapping: signal([0]),
    importedRows: signal(undefined),
    rowErrorsFor: vi.fn(() => computed(() => [])),
    rowContainsErrors: vi.fn(() => computed(() => false)),
    testRows: vi.fn(),
    selectTable: vi.fn(),
    columnDefinition: vi.fn(() => computed(() => columnDefinitionMock)),
    cellInformation: vi.fn(() => computed(() => undefined)),
    setCellContents: vi.fn(),
    changeColumnOrder: vi.fn(),
    canImport: signal(false),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableComponent],
      providers: [
        { provide: AppStore, useValue: store },
        { provide: Router, useValue: { navigateByUrl: vi.fn() } },
        { provide: ActivatedRoute, useValue: { params: of({ schema: 'public', table: 'orders' }) } },
        { provide: ToastService, useValue: { show: vi.fn() } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('lists the allowed numeric constraints and enum values in the column tooltip', () => {
    const tooltip = component.getColumnTitle(0);
    expect(tooltip).toContain('Allowed Data Types: number');
    expect(tooltip).toContain('Number range: 0 .. 100');
    expect(tooltip).toContain('Allowed values: 10|25');
  });
});
