import { Component, ElementRef, HostListener, OnDestroy, OnInit, viewChildren, ChangeDetectionStrategy, computed, effect } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { ClipboardHelper } from '../lib/clipboard-helper.model';
import { CellContent } from '../lib/models/cellcontent.model';
import { Row } from '../lib/models/rest-backend/row.model';
import { CellInformation } from '../lib/models/cellinformation.model';
import { RowContainer } from '../lib/models/rest-backend/row-container.model';
import { NgClass } from '@angular/common';
import { ErrorBadgeComponent } from '../error-badge/error-badge.component';
import { AppStore } from '../lib/store/app-store.service';

@Component({
    selector: 'app-table',
    templateUrl: './table.component.html',
    styleUrls: ['./table.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [RouterLink, NgClass, ErrorBadgeComponent]
})
export class TableComponent implements OnInit, OnDestroy {
  readonly schemasCount = computed(() => this.store.schemas().length);
  readonly columnDefinitions = this.store.columnDefinitions;
  readonly cells = viewChildren<ElementRef<HTMLTableCellElement>>('td');
  sourceIndex: number | undefined;
  presumedTargetIndex: number | undefined;
  schema = '';
  private table = '';
  private subscriptions: Subscription[] = [];

  constructor(private readonly store: AppStore, private readonly router: Router, private readonly route: ActivatedRoute) {
    effect(() => {
      const rowNumbers = this.store.rowNumbers();
      const errorPresent = this.store.tableContainsErrors();
      if (!errorPresent && rowNumbers.length > 0) {
        const rows: Row[] = this.createRowsForBackend(this.store.cellInformations(), rowNumbers);
        this.store.testRows(this.createRowContainer(rows));
      }
    });
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.route.params.subscribe(({schema, table}) => {
        const targetTable = this.store.tables().find((candidate) =>
          candidate.name.toLocaleLowerCase() === table.toString().toLocaleLowerCase() &&
          candidate.schema.toLocaleLowerCase() === (schema as string).toLocaleLowerCase()
        );
        if (!targetTable) {
          this.router.navigateByUrl('/schemas', {replaceUrl: true});
        } else {
          this.schema = schema.toString();
          this.table = table.toString();
          this.store.selectTable(targetTable);
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
    for (const rowNumber of rowNumbers) {
      const cells = cellInformations.filter((cell) => cell.row === rowNumber);
      rows[rowNumber] = {};
      for (const cell of cells) {
        if (!!cell.typedValue || !cell.canBeEmpty) {
          rows[rowNumber][cell.name] = cell.typedValue;
        }
      }
    }
    return rows;
  }

  ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      sub.unsubscribe();
    }
  }

  getColumn = (columnIndex: number) => this.store.columnDefinition(columnIndex)();

  getCellInformation = (rowIndex: number, columIndex: number) =>
    this.store.cellInformation(rowIndex, columIndex)();

  getColumnTitle(columnPosition: number): string {
    const column = this.getColumn(columnPosition);
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
    const allowedTypes = column?.typeInfo?.allowedTypes ?? [];
    content.push($localize `Allowed Data Types: ` + allowedTypes.join('|'));
    return content.join($localize `, `);
  }

  getRowContainsErrors(rowIndex: number) {
    return this.store.rowContainsErrors(rowIndex)();
  }

  getRowErrorDescriptions(rowIndex: number) {
    return this.store.rowErrorsFor(rowIndex)().join('; ');
  }

  readonly columnMappings = this.store.columnMapping;
  readonly tableContainsErrors = this.store.tableContainsErrors;
  readonly rowNumbers = this.store.rowNumbers;
  readonly rowCount = computed(() => this.rowNumbers().length);
  readonly canImport = this.store.canImport;
  readonly importedRows = this.store.importedRows;

  @HostListener('window:paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    event.stopPropagation();
    try {
      if (event.clipboardData) {
        const rows = ClipboardHelper.getTableContent(event.clipboardData);
        const columnMappings = this.store.columnMapping();
        this.fitRowWidth(rows, columnMappings);
        this.fillCellContents(rows);
      }
    } catch (error: any) {
      console.error(error.message);
      console.error(error.toString());
      this.store.setError(error.message ?? error.toString());
    }
  }

  private fitRowWidth(rows: string[][], columnMappings: number[]) {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.length > columnMappings.length) {
        row.splice(columnMappings.length);
      } else if (row.length < columnMappings.length) {
        rows[i] = row.concat(Array(columnMappings.length - row.length).fill(''));
      }
    }
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
      this.store.setCellContents(contents);
    }
  }

  onDragStart(event: DragEvent, index: number) {
    this.sourceIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.setData('text', index.toString());
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragEnd() {
    this.sourceIndex = undefined;
    this.presumedTargetIndex = undefined;
  }

  onDragOver(event: DragEvent, targetIndex: number) {
    if (this.sourceIndex !== undefined && this.sourceIndex !== targetIndex) {
      this.presumedTargetIndex = targetIndex;
      event.preventDefault();
    } else {
      this.presumedTargetIndex = undefined;
    }
  }

  onDrop(targetIndex: number) {
    if (this.sourceIndex !== undefined) {
      const columnMappings = [...this.store.columnMapping()];
      const val = columnMappings.splice(this.sourceIndex, 1)[0];
      columnMappings.splice(targetIndex, 0, val);
      this.store.changeColumnOrder(columnMappings);
    }
    this.presumedTargetIndex = undefined;
    this.sourceIndex = undefined;
  }

  onImport() {
    const cellInformations = this.store.cellInformations();
    const rowNumbers = this.store.rowNumbers();
    const rows: Row[] = this.createRowsForBackend(cellInformations, rowNumbers);
    const content = this.createRowContainer(rows);
    this.store.importRows(content);
  }
}

