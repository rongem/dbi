import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DbiService } from '../services/dbi.service';
import { AppStore } from './app-store.service';

describe('AppStore', () => {
  let store: AppStore;
  const dbi = {
    retrieveUser: vi.fn(),
    loadTables: vi.fn(),
    loadColumns: vi.fn(),
    testRows: vi.fn(),
    importRows: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [AppStore, { provide: DbiService, useValue: dbi }],
    });
    store = TestBed.inject(AppStore);
  });

  it('stores backend validation errors when import preview fails', () => {
    dbi.testRows.mockReturnValue(
      throwError(() => new HttpErrorResponse({
        status: 400,
        error: {
          error: {
            details: {
              errors: [{ row: 0, msg: 'Value is invalid' }],
            },
          },
        },
      }))
    );

    store.testRows({ schema: 'public', table: 'orders', rows: [{ amount: 999 }] });

    expect(store.rowErrors()).toEqual([{ row: 0, msg: 'Value is invalid' }]);
    expect(store.canImport()).toBe(false);
  });

  it('stores the imported row count after a successful import', () => {
    dbi.importRows.mockReturnValue(of({ success: true, data: { rowsInserted: 3 } }));

    store.importRows({ schema: 'public', table: 'orders', rows: [{ amount: 25 }] });

    expect(store.importedRows()).toBe(3);
    expect(store.cellContents()).toEqual([]);
    expect(store.working()).toBe(false);
  });
});
