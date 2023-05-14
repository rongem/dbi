import { createSelector, createFeatureSelector } from '@ngrx/store';

import { State, STORE } from './store.reducer';

const appState = createFeatureSelector<State>(STORE);

export const working = createSelector(appState, state => state.working);

export const userName = createSelector(appState, state => state.userName);

export const databaseName = createSelector(appState, state => state.databaseName);

export const error = createSelector(appState, state => state.error);

export const notAuthorized = createSelector(appState, state => state.notAuthorized);

export const isAuthenticated = createSelector(appState, state => !!state.userName);
