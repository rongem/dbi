import { Action, createReducer, on } from "@ngrx/store";
import * as StoreActions from './store.actions';
import { Table } from "../models/rest-backend/table.model";

export const STORE = 'STORE';

export interface State {
    tablesLoaded: boolean;
    notAuthorized: boolean;
    working: boolean;
    tables: Table[];
    selectedTable?: Table;
    userName?: string;
    error?: string;
};

const initialState: State = {
    tablesLoaded: false,
    tables: [],
    notAuthorized: false,
    working: false,
    userName: undefined,
};

export function storeReducer(appState: State | undefined, appAction: Action) {
    return createReducer(
        initialState,
        on(StoreActions.retrieveUser, (state, action) => ({
            ...state,
            userName: undefined,
            notAuthorized: false,
            working: true,
        })),
        on(StoreActions.setUser, (state, action) => ({
            ...state,
            userName: action.name,
            notAuthorized: !action.isAuthorized,
            working: false,
        })),
        on(StoreActions.loadTables, (state, action) => ({
            ...state,
            tables: [],
            tablesLoaded: false,
            working: true,
        })),
        on(StoreActions.tablesLoaded, (state, action) => ({
            ...state,
            tables: [...action.tables],
            tablesLoaded: true,
            working: false,
        })),
    )(appState, appAction);
}

