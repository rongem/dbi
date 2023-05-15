import { createSelector, createFeatureSelector } from '@ngrx/store';

import { State, STORE } from './store.reducer';

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
