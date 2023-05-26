import { createSelector, createFeatureSelector } from '@ngrx/store';

import { State, STORE } from './store.reducer';
import { CellInformation } from '../models/cellinformation.model';
import { CellContent } from '../models/cellcontent.model';

const appState = createFeatureSelector<State>(STORE);

export const working = createSelector(appState, state => state.working);

export const userName = createSelector(appState, state => state.userName);

export const databaseName = createSelector(appState, state => state.databaseName);

export const error = createSelector(appState, state => state.error);

export const notAuthorized = createSelector(appState, state => state.notAuthorized);

export const isAuthenticated = createSelector(appState, state => !!state.userName);

export const tables = createSelector(appState, state => state.tables);

export const schemas = createSelector(tables, tables => [...new Set(tables.map(t => t.schema))].sort());

export const tableNamesForSchema = (schema: string) => createSelector(tables, tables => tables.filter(t => t.schema === schema).map(t => t.name).sort());

export const columns = createSelector(appState, state => state.columns?.sort((a, b) => a.ordinalPosition - b.ordinalPosition) ?? []);

export const column = (columnPosition: number) => createSelector(columns, columns => columns.find(c => c.ordinalPosition === columnPosition + 1));

const cellContents = createSelector(appState, state => state.cellContents);

export const rowNumbers = createSelector(cellContents, contents => [...new Set(contents.map(c => c.row))].sort());

export const row = (rowIndex: number) => createSelector(cellContents, contents => contents.filter(c => c.row === rowIndex));

const cellContent = (rowIndex: number, columIndex: number) => createSelector(cellContents, contents => contents.find(c => c.column === columIndex && c.row === rowIndex));

export const cellInformation = (rowIndex: number, columIndex: number, columnDefinitionIndex: number) => 
    createSelector(cellContent(rowIndex, columIndex), column(columnDefinitionIndex), (cell, column) => {
        if (!column) return null;
        if (!cell) cell = new CellContent('', rowIndex, columIndex);
        return new CellInformation(cell, column);
    }
);

export const rowContainsErrors = (rowIndex: number, translateColumns: number[]) => createSelector(row(rowIndex), columns, (cells, columns) => 
    cells.some(c => new CellInformation(c, columns[translateColumns[c.column]]).containsErrors)
);

export const tableContainsErrors = (translateColumns: number[]) => createSelector(cellContents, columns, (cells, columns) => 
    cells.some(c => new CellInformation(c, columns[translateColumns[c.column]]).containsErrors)
);
