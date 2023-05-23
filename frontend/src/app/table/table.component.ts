import { Component, ElementRef, HostListener, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subscription, map, take, withLatestFrom } from 'rxjs';
import * as StoreSelectors from '../lib/store/store.selectors';
import * as StoreActions from '../lib/store/store.actions';
import { ClipboardHelper } from '../lib/clipboard-helper.model';
import { Actions, ofType } from '@ngrx/effects';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableComponent implements OnInit, OnDestroy {
  columnDefinitions = this.store.select(StoreSelectors.columns);
  // table cells for selection
  @ViewChildren('td') cells!: QueryList<ElementRef<HTMLTableCellElement>>;
  // dragging source
  sourceIndex: number | undefined;
  // index of column that dragged column is hovering on
  presumedTargetIndex: number | undefined;
  // columns for drag and drop column order change
  columns: number[] = [];
  // what data should be shown with column
  columnContents: string[] = [];
  // storage for errors while updating from clipboard
  private errors = new Map<string, string[]>();
  private subscription?: Subscription;
  constructor(private store: Store, private router: Router, private route: ActivatedRoute, private actions$: Actions) {}
  ngOnInit(): void {
    this.subscription = this.route.params.pipe(withLatestFrom(this.store.select(StoreSelectors.tables))).subscribe(([{schema, table}, tables]) => {
      const targettable = tables.find(t => t.name.toLocaleLowerCase() === (table as string).toLocaleLowerCase() &&
        t.schema.toLocaleLowerCase() === (schema as string).toLocaleLowerCase());
      if (!targettable) {
        this.router.navigateByUrl('/schemas', {replaceUrl: true});
      } else {
        this.store.dispatch(StoreActions.selectTable(targettable));
        this.actions$.pipe(
          ofType(StoreActions.columnsLoaded),
          take(1),
        ).subscribe(cols => {
          this.columns = Array.from(Array(cols.columns.length).keys())
          console.log(this.columns);
        });
      }
    });
    // this.schemas.subscribe()
  }
  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  getColumn = (columnPosition: number) => this.store.select(StoreSelectors.column(columnPosition));

  getColumnTitle = (columnPosition: number) => this.getColumn(columnPosition).pipe(
    map(column => {
      const content: string[] = [];
      if (column?.primary) {
        content.push('Primary key');
      }
      if (column?.foreignKey) {
        content.push('Foreign key');
      }
      if (column?.unique) {
        content.push('Unique constraint');
      }
      if (column?.hasDefaultValue) {
        content.push('Default value present');
      }
      if (column?.isNullable) {
        content.push('Null values allowed');
      }
      content.push('Allowed Data Types: ' + column?.typeInfo.allowedTypes.join('|'));
      return content.join(', ');
    })
  );
  
  @HostListener('window:paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    event.stopPropagation();
    try {
      if (event.clipboardData) {
        const lines = ClipboardHelper.getTableContent(event.clipboardData);
        this.fitLineSize(lines);
        this.fillLineContents(lines);
      }
    } catch (error: any) {
      this.store.dispatch(StoreActions.setError(error.message ?? error.toString()));
    }
  }

  private fitLineSize(lines: string[][]) {
    for (let line of lines) {
      // remove columns that are out of possible insertion range
      if (line.length > this.columns.length) {
        line.splice(this.columns.length);
      }
    };
  }

  private fillLineContents(lines: string[][]) {
    for (let line of lines) {
      
    }
  }

  stopPropagation(event: Event) {
    event.stopPropagation();
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

  onDrop(targetIndex: number) {
    if (this.sourceIndex !== undefined) {
      // remove source index
      const val = this.columns.splice(this.sourceIndex, 1)[0];
      // put it into new place
      this.columns.splice(targetIndex, 0, val);
    }
    // clean up temporary variables
    this.presumedTargetIndex = undefined;
    this.sourceIndex = undefined;
  }

  onCellClick(event: FocusEvent) {
    let colIndex = -1;
    let rowIndex = -1;
    if (event.type === 'focus' && event.target instanceof HTMLTableCellElement) {
      colIndex = event.target.cellIndex - 1;
      rowIndex = (event.target.parentElement as HTMLTableRowElement).rowIndex -1;
    }
  }

  private getRowIndex = (cell: HTMLTableCellElement) => (cell.parentElement as HTMLTableRowElement).rowIndex;

}

