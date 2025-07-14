import { Component, ElementRef, HostListener, OnDestroy, OnInit, viewChildren } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { Subscription, firstValueFrom, map, withLatestFrom } from 'rxjs';

import * as StoreSelectors from '../lib/store/store.selectors';
import * as StoreActions from '../lib/store/store.actions';
import { ClipboardHelper } from '../lib/clipboard-helper.model';
import { CellContent } from '../lib/models/cellcontent.model';
import { Row } from '../lib/models/rest-backend/row.model';
import { CellInformation } from '../lib/models/cellinformation.model';
import { RowContainer } from '../lib/models/rest-backend/row-container.model';
import { NgClass, AsyncPipe } from '@angular/common';
import { ErrorBadgeComponent } from '../error-badge/error-badge.component';

@Component({
    selector: 'app-table',
    templateUrl: './table.component.html',
    styleUrls: ['./table.component.scss'],
    imports: [RouterLink, NgClass, ErrorBadgeComponent, AsyncPipe]
})
export class TableComponent implements OnInit, OnDestroy {
  schemasCount = this.store.select(StoreSelectors.schemas).pipe(map(schemas => schemas.length));
  columnDefinitions = this.store.select(StoreSelectors.columnDefinitions);
  // table cells for selection
  readonly cells = viewChildren<ElementRef<HTMLTableCellElement>>('td');
  // dragging source
  sourceIndex: number | undefined;
  // index of column that dragged column is hovering on
  presumedTargetIndex: number | undefined;
  schema: string = '';
  private table: string = '';
  private subscriptions: Subscription[] = [];
  constructor(private store: Store, private router: Router, private route: ActivatedRoute, private actions$: Actions) {}
  ngOnInit(): void {
    this.subscriptions.push(
      this.route.params.pipe(
        withLatestFrom(this.store.select(StoreSelectors.tables))
      ).subscribe(([{schema, table}, tables]) => {
        const targetTable = tables.find(t => t.name.toLocaleLowerCase() === table.toString().toLocaleLowerCase() &&
          t.schema.toLocaleLowerCase() === (schema as string).toLocaleLowerCase());
        if (!targetTable) {
          this.router.navigateByUrl('/schemas', {replaceUrl: true});
        } else {
          this.schema = schema.toString();
          this.table = table.toString();
          this.store.dispatch(StoreActions.selectTable(targetTable));
        }
      })
    );
    this.subscriptions.push(
      this.actions$.pipe(
        ofType(StoreActions.setCellContents, StoreActions.changeColumnOrder),
        withLatestFrom(
          this.store.select(StoreSelectors.cellInformations),
          this.rowNumbers,
          this.store.select(StoreSelectors.tableContainsErrors),
        ),
      ).subscribe(([, cellInformations, rowNumbers, errorPresent]) => {
        if (errorPresent === false && rowNumbers.length > 0) {
          const rows: Row[] = this.createRowsForBackend(cellInformations, rowNumbers);
          this.store.dispatch(StoreActions.testRowsInBackend({content: this.createRowContainer(rows)}));
        }
      })
    );
  }
  private createRowContainer(rows: Row[]): RowContainer {
    return {
      schema: this.schema,
      table: this.table,
      rows,
    };
  }

  private createRowsForBackend(cellInformations: CellInformation[], rowNumbers: number[]) {
    const rows: Row[] = [];
    for (let rowNumber of rowNumbers) {
      const cells = cellInformations.filter(c => c.row === rowNumber);
      rows[rowNumber] = {};
      for (let cell of cells) {
        if (!!cell.typedValue || !cell.canBeEmpty) {
          rows[rowNumber][cell.name] = cell.typedValue;
        }
      }
    }
    return rows;
  }

  ngOnDestroy(): void {
    for (let sub of this.subscriptions) {
      sub.unsubscribe();
    }
  }

  getColumn = (columnIndex: number) => this.store.select(StoreSelectors.columnDefinition(columnIndex));

  getCellInformation = (rowIndex: number, columIndex: number) =>
    this.store.select(StoreSelectors.cellInformation(rowIndex, columIndex));

  getColumnTitle = (columnPosition: number) => this.getColumn(columnPosition).pipe(
    map(column => {
      const content: string[] = [];
      if (column?.primary) {
        content.push($localize `Primary key`);
      }
      if (column?.foreignKey) {
        content.push($localize `Foreign key`);
      }
      if (column?.unique) {
        content.push($localize `Unique constraint`);
      }
      if (column?.hasDefaultValue) {
        content.push($localize `Default value present`);
      }
      if (column?.isNullable) {
        content.push($localize `Null values allowed`);
      }
      content.push($localize `Allowed Data Types: ` + column?.typeInfo.allowedTypes.join(`|`));
      return content.join($localize `, `);
    })
  );

  getRowContainsErrors = (rowIndex: number) => this.store.select(StoreSelectors.rowContainsErrors(rowIndex));

  getRowErrorDescriptions = (rowIndex: number) => this.store.select(StoreSelectors.rowErrors(rowIndex)).pipe(map(errors => errors.join('; ')));

  // columns for drag and drop column order change
  get columnMappings() { return this.store.select(StoreSelectors.columnMappings) };

  get tableContainsErrors() { return this.store.select(StoreSelectors.tableContainsErrors); }

  get rowNumbers() {
    return this.store.select(StoreSelectors.rowNumbers);
  }

  get rowCount() {
    return this.rowNumbers.pipe(map(r => r.length));
  }

  get canImport() {
    return this.store.select(StoreSelectors.canImport);
  }

  get importedRows() {
    return this.store.select(StoreSelectors.importedRows);
  }
  
  @HostListener('window:paste', ['$event'])
  async onPaste(event: ClipboardEvent) {
    event.stopPropagation();
    try {
      if (event.clipboardData) {
        const rows = ClipboardHelper.getTableContent(event.clipboardData);
        const columnMappings = await firstValueFrom(this.columnMappings);
        this.fitRowWidth(rows, columnMappings);
        this.fillCellContents(rows);
      }
    } catch (error: any) {
      console.error(error.message);
      console.error(error.toString());
      this.store.dispatch(StoreActions.setError({error: error.message ?? error.toString()}));
    }
  }

  private fitRowWidth(rows: string[][], columnMappings: number[]) {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.length > columnMappings.length) {
        // remove columns that are out of possible insertion range
        row.splice(columnMappings.length);
      } else if (row.length < columnMappings.length) {
        // fill up row columns if not enough data has been provided
        rows[i] = row.concat(Array(columnMappings.length - row.length).fill(''));
      }
    };
  }

  private fillCellContents(rows: string[][]) {
    const contents: CellContent[] = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      for (let j = 0; j < row.length; j++) {
        const cellContent = new CellContent(row[j], i, j);
        contents.push(cellContent);
      }
    }
    if (contents.length > 0) {
      this.store.dispatch(StoreActions.setCellContents({contents}));
    }
  }

  onDragStart(event: DragEvent, index: number) {
    // set index when starting drag&drop
    this.sourceIndex = index;
    // firefox needs this
    if (event.dataTransfer) {
      event.dataTransfer.setData('text', index.toString());
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragEnd() {
    // cancel drag&drop
    this.sourceIndex = undefined;
    this.presumedTargetIndex = undefined;
  }

  onDragOver(event: DragEvent, targetIndex: number) {
    if (this.sourceIndex !== undefined && this.sourceIndex !== targetIndex) {
      this.presumedTargetIndex = targetIndex;
      // enable drop
      event.preventDefault();
    } else {
      this.presumedTargetIndex = undefined;
    }
  }

  async onDrop(targetIndex: number) {
    if (this.sourceIndex !== undefined) {
      const columnMappings = await firstValueFrom(this.columnMappings);
      // remove source index
      const val = columnMappings.splice(this.sourceIndex, 1)[0];
      // put it into new place
      columnMappings.splice(targetIndex, 0, val);
      this.store.dispatch(StoreActions.changeColumnOrder({columnMappings}));
    }
    // clean up temporary variables
    this.presumedTargetIndex = undefined;
    this.sourceIndex = undefined;
  }

  async onImport() {
    const cellInformations = await firstValueFrom(this.store.select(StoreSelectors.cellInformations));
    const rowNumbers = await firstValueFrom(this.store.select(StoreSelectors.rowNumbers));
    const rows: Row[] = this.createRowsForBackend(cellInformations, rowNumbers);
    const content = this.createRowContainer(rows);
    this.store.dispatch(StoreActions.importRowsInBackend({content}));
  }

  /*onCellClick(event: FocusEvent) {
    let colIndex = -1;
    let rowIndex = -1;
    if (event.type === 'focus' && event.target instanceof HTMLTableCellElement) {
      colIndex = event.target.cellIndex - 1;
      rowIndex = (event.target.parentElement as HTMLTableRowElement).rowIndex -1;
    }
  }

  private getRowIndex = (cell: HTMLTableCellElement) => (cell.parentElement as HTMLTableRowElement).rowIndex;
*/
}

