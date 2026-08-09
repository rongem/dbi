import { Injectable, computed, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';

import { ApiResponse } from '../models/api-response.model';
import { CellContent } from '../models/cellcontent.model';
import { CellInformation } from '../models/cellinformation.model';
import { Column } from '../models/rest-backend/column.model';
import { ErrorList } from '../models/rest-backend/errorlist.model';
import { RowContainer } from '../models/rest-backend/row-container.model';
import { Table } from '../models/rest-backend/table.model';
import { DbiService } from '../services/dbi.service';

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
  csrfToken?: string;
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
  readonly notAuthorized = computed(() => this.state().notAuthorized);
  readonly csrfToken = computed(() => this.state().csrfToken);
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
      csrfToken: undefined,
      notAuthorized: false,
      working: true,
    });

    this.dbi.retrieveUser().subscribe({
      next: (response) => this.setUser(this.extractData(response, 'user')),
      error: () => undefined,
    });
  }

  setUser(user: { name: string; databaseName: string; isAuthorized: boolean; csrfToken?: string }): void {
    this.updateState({
      userName: user.name,
      databaseName: user.databaseName,
      notAuthorized: !user.isAuthorized,
      csrfToken: user.csrfToken,
      working: false,
    });
  }

  loadTables(): Observable<Table[]> {
    if (this.tablesLoaded()) {
      return of(this.tables());
    }

    this.updateState({ working: true });

    return this.dbi.loadTables().pipe(
      map((response) => {
        const tables = this.extractData(response, 'tables');
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
      catchError(() => {
        this.updateState({ working: false });
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
      next: (response) => {
        const columns = this.extractData(response, 'columns');
        this.updateState({
          columnDefinitions: [...columns],
          cellContents: [],
          columnMapping: Array.from(Array(columns.length).keys()),
          working: false,
          rowErrors: [],
          canImport: false,
        });
      },
      error: () => undefined,
    });
  }

  setCellContents(contents: CellContent[]): void {
    this.updateState({
      cellContents: [...contents],
      rowErrors: [],
    });
  }

  changeColumnOrder(columnMappings: number[]): void {
    this.updateState({
      columnMapping: [...columnMappings],
      working: false,
      rowErrors: [],
      canImport: false,
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
      next: (response) => {
        const result = this.extractData(response, 'import result');
        this.updateState({
          cellContents: [],
          rowErrors: [],
          working: false,
          canImport: false,
          importedRows: result.rowsInserted,
        });
      },
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
    const errors = this.extractErrors(error);
    if (errors.length === 0) {
      console.log(error);
    }
    this.updateState({ working: false, rowErrors: [...errors], canImport: errors.length === 0 });
  }

  private extractData<T>(response: ApiResponse<T> | T, fallbackName: string): T {
    if (response && typeof response === 'object' && 'success' in response && response.success === true) {
      return response.data as T;
    }
    return response as T;
  }

  private extractErrors(error: HttpErrorResponse): ErrorList[] {
    const details = (error.error as { error?: { details?: { errors?: ErrorList[] } } } | undefined)?.error?.details;
    return (details?.errors as ErrorList[] | undefined) ?? [];
  }

}
