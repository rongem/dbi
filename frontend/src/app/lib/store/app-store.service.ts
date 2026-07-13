import { Injectable, computed, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';

import { DbiService } from '../services/dbi.service';
import { CellContent } from '../models/cellcontent.model';
import { CellInformation } from '../models/cellinformation.model';
import { Column } from '../models/rest-backend/column.model';
import { ErrorList } from '../models/rest-backend/errorlist.model';
import { RowContainer } from '../models/rest-backend/row-container.model';
import { Table } from '../models/rest-backend/table.model';

export interface AppStoreState {
  tablesLoaded: boolean;
  notAuthorized: boolean;
  working: boolean;
  tables: Table[];
  selectedTable?: Table;
  columnDefinitions?: Column[];
  cellContents: CellContent[];
  columnMapping: number[];
  userName?: string;
  databaseName?: string;
  error?: string;
  rowErrors: ErrorList[];
  canImport: boolean;
  importedRows?: number;
}

const initialState: AppStoreState = {
  tablesLoaded: false,
  tables: [],
  notAuthorized: false,
  working: false,
  cellContents: [],
  columnMapping: [],
  userName: undefined,
  rowErrors: [],
  canImport: false,
};

@Injectable({ providedIn: 'root' })
export class AppStore {
  private readonly state = signal<AppStoreState>(initialState);

  readonly working = computed(() => this.state().working);
  readonly userName = computed(() => this.state().userName);
  readonly databaseName = computed(() => this.state().databaseName);
  readonly error = computed(() => this.state().error);
  readonly notAuthorized = computed(() => this.state().notAuthorized);
  readonly tables = computed(() => this.state().tables);
  readonly tablesLoaded = computed(() => this.state().tablesLoaded);
  readonly schemas = computed(() => [...new Set(this.tables().map((table) => table.schema))].sort());
  readonly columnDefinitions = computed(() => [...(this.state().columnDefinitions ?? [])].sort((a, b) => a.ordinalPosition - b.ordinalPosition));
  readonly columnMapping = computed(() => this.state().columnMapping);
  readonly cellContents = computed(() => this.state().cellContents);
  readonly rowNumbers = computed(() => [...new Set(this.cellContents().map((cell) => cell.row))]);
  readonly canImport = computed(() => this.state().canImport);
  readonly importedRows = computed(() => this.state().importedRows);
  readonly rowErrors = computed(() => this.state().rowErrors);
  readonly tableContainsErrors = computed(() => this.cellInformations().some((cell) => cell.containsErrors));

  constructor(private readonly dbi: DbiService) {}

  retrieveUser(): void {
    this.updateState({
      userName: undefined,
      databaseName: undefined,
      notAuthorized: false,
      working: true,
      error: undefined,
    });

    this.dbi.retrieveUser().subscribe({
      next: (user) => this.setUser(user),
      error: (error) => this.handleError(error),
    });
  }

  setUser(user: { name: string; databaseName: string; isAuthorized: boolean }): void {
    this.updateState({
      userName: user.name,
      databaseName: user.databaseName,
      notAuthorized: !user.isAuthorized,
      working: false,
    });
  }

  clearError(): void {
    this.updateState({ error: undefined });
  }

  setError(error?: string): void {
    this.updateState({ error, working: false });
  }

  loadTables(): Observable<Table[]> {
    if (this.tablesLoaded()) {
      return of(this.tables());
    }

    this.updateState({ working: true });

    return this.dbi.loadTables().pipe(
      map((tables) => {
        this.updateState({
          tables: [...tables],
          selectedTable: undefined,
          columnDefinitions: undefined,
          cellContents: [],
          tablesLoaded: true,
          working: false,
          canImport: false,
          importedRows: undefined,
        });
        return tables;
      }),
      catchError((error) => {
        this.handleError(error);
        return of([]);
      }),
    );
  }

  selectTable(table: Table): void {
    this.updateState({
      selectedTable: { ...table },
      columnDefinitions: undefined,
      cellContents: [],
      working: true,
      rowErrors: [],
      canImport: false,
      importedRows: undefined,
    });

    this.dbi.loadColumns(table).subscribe({
      next: (columns) => {
        this.updateState({
          columnDefinitions: [...columns],
          cellContents: [],
          columnMapping: Array.from(Array(columns.length).keys()),
          working: false,
          rowErrors: [],
          canImport: false,
        });
      },
      error: (error) => this.handleError(error),
    });
  }

  setCellContents(contents: CellContent[]): void {
    this.updateState({
      cellContents: [...contents],
      rowErrors: [],
      error: undefined,
    });
  }

  changeColumnOrder(columnMappings: number[]): void {
    this.updateState({
      columnMapping: [...columnMappings],
      working: false,
      rowErrors: [],
      canImport: false,
      error: undefined,
    });
  }

  testRows(content: RowContainer): void {
    this.updateState({
      working: true,
      rowErrors: [],
      canImport: false,
    });

    this.dbi.testRows(content).subscribe({
      next: () => this.updateState({ canImport: true, working: false }),
      error: (error) => this.handleImportError(error),
    });
  }

  importRows(content: RowContainer): void {
    this.updateState({ working: true, rowErrors: [] });

    this.dbi.importRows(content).subscribe({
      next: (result) => this.updateState({
        cellContents: [],
        rowErrors: [],
        working: false,
        canImport: false,
        importedRows: result.rowsInserted,
      }),
      error: (error) => this.handleImportError(error),
    });
  }

  tableNamesForSchema(schema: string) {
    return computed(() => this.tables().filter((table) => table.schema === schema).map((table) => table.name).sort());
  }

  columnDefinition(columnPosition: number) {
    return computed(() => this.columnDefinitions().find((column) => column.ordinalPosition === columnPosition + 1));
  }

  cellInformation(rowIndex: number, columnIndex: number) {
    return computed(() => this.cellInformations().find((cell) => cell.row === rowIndex && cell.column === columnIndex));
  }

  rowContainsErrors(rowIndex: number) {
    return computed(() => this.rowErrorsFor(rowIndex)().length > 0 || this.cellInformations().some((cell) => cell.row === rowIndex && cell.containsErrors));
  }

  rowErrorsFor(rowIndex: number) {
    return computed(() => [
      ...this.rowErrors().filter((error) => error.row === rowIndex).map((error) => error.msg),
      ...this.cellInformations().filter((cell) => cell.row === rowIndex && cell.containsErrors).map((cell) => 'Column: ' + cell.name + ': ' + cell.errors.join(', ')),
    ]);
  }

  readonly cellInformations = computed(() => this.cellContents().map((cell) => new CellInformation(cell, this.columnDefinitions()[this.columnMapping()[cell.column]])));

  private updateState(update: Partial<AppStoreState>): void {
    this.state.update((current) => ({ ...current, ...update }));
  }

  private handleImportError(error: HttpErrorResponse): void {
    const errors = (error.error?.data?.errors as ErrorList[] | undefined) ?? [];
    if (errors.length === 0) {
      console.log(error);
    }
    this.updateState({ working: false, rowErrors: [...errors], canImport: errors.length === 0 });
  }

  private handleError(error: HttpErrorResponse): void {
    console.error(error);
    this.updateState({ error: error.message ?? error.toString(), working: false });
  }
}
