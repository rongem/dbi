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

export const columnDefinitions = createSelector(appState, state => state.columnDefinitions?.sort((a, b) => a.ordinalPosition - b.ordinalPosition) ?? []);

export const columnDefinition = (columnPosition: number) => createSelector(columnDefinitions, columns => columns.find(c => c.ordinalPosition === columnPosition + 1));

export const cellContents = createSelector(appState, state => state.cellContents);

export const columnMappings = createSelector(appState, state => state.columnMapping);

export const rowNumbers = createSelector(cellContents, contents => [...new Set(contents.map(c => c.row))].sort());

export const cellInformations = createSelector(cellContents, columnMappings, columnDefinitions, (cells, columnMappings, columnDefinitions) => 
    cells.map(c => new CellInformation(c, columnDefinitions[columnMappings[c.column]]))
);

export const cellInformation = (rowIndex: number, columIndex: number) => createSelector(cellInformations, cells => cells.find(c => c.row === rowIndex && c.column === columIndex));

export const rowContainsErrors = (rowIndex: number) => createSelector(cellInformations, cells => cells.some(c => c.row === rowIndex && c.containsErrors));

export const tableContainsErrors = createSelector(cellInformations, cells => cells.some(c => c.containsErrors));

export const canImport = createSelector(appState, state => state.canImport);
