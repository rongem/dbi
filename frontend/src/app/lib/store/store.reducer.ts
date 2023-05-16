import { Action, ActionReducerMap, createReducer, on } from "@ngrx/store";
import * as StoreActions from './store.actions';
import { Table } from "../models/rest-backend/table.model";
import { Column } from "../models/rest-backend/column.model";

export const STORE = 'STORE';

export interface AppState {
    [STORE]: State,
}

export const appReducer: ActionReducerMap<AppState> = {
    [STORE]: storeReducer,
};


export interface State {
    tablesLoaded: boolean;
    notAuthorized: boolean;
    working: boolean;
    tables: Table[];
    selectedTable?: Table;
    columns?: Column[];
    userName?: string;
    databaseName?: string;
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
            databaseName: undefined,
            notAuthorized: false,
            working: true,
        })),
        on(StoreActions.setUser, (state, action) => ({
            ...state,
            userName: action.name,
            databaseName: action.databaseName,
            notAuthorized: !action.isAuthorized,
            working: false,
        })),
        on(StoreActions.loadTables, (state, action) => ({
            ...state,
            tables: [],
            tablesLoaded: false,
            selectedTable: undefined,
            columns: undefined,
            working: true,
        })),
        on(StoreActions.tablesLoaded, (state, action) => ({
            ...state,
            tables: [...action.tables],
            selectedTable: undefined,
            columns: undefined,
            tablesLoaded: true,
            working: false,
        })),
        on(StoreActions.selectTable, (state, action) => ({
            ...state,
            selectedTable: {...action},
            columns: undefined,
            working: true,
        })),
        on(StoreActions.columnsLoaded, (state, action) => ({
            ...state,
            columns: [...action.columns],
            working: false,
        })),
    )(appState, appAction);
}

