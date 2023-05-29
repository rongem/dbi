import { Action, ActionReducerMap, createReducer, on } from "@ngrx/store";
import * as StoreActions from './store.actions';
import { Table } from "../models/rest-backend/table.model";
import { Column } from "../models/rest-backend/column.model";
import { CellContent } from "../models/cellcontent.model";
import { ErrorList } from "../models/rest-backend/errorlist.model";

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
    cellContents: CellContent[];
    userName?: string;
    databaseName?: string;
    error?: string;
    rowErrors: ErrorList[];
    canImport: boolean;
};

const initialState: State = {
    tablesLoaded: false,
    tables: [],
    notAuthorized: false,
    working: false,
    cellContents: [],
    userName: undefined,
    rowErrors: [],
    canImport: false,
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
        on(StoreActions.setError, (state, action) => ({
            ...state,
            error: action.error,
            working: false,
        })),
        on(StoreActions.loadTables, (state, action) => ({
            ...state,
            tables: [],
            tablesLoaded: false,
            selectedTable: undefined,
            columns: undefined,
            cellContents: [],
            working: true,
            rowErrors: [],
            canImport: false,
        })),
        on(StoreActions.tablesLoaded, (state, action) => ({
            ...state,
            tables: [...action.tables],
            selectedTable: undefined,
            columns: undefined,
            cellContents: [],
            tablesLoaded: true,
            working: false,
            canImport: false,
        })),
        on(StoreActions.selectTable, (state, action) => ({
            ...state,
            selectedTable: {...action},
            columns: undefined,
            cellContents: [],
            working: true,
            rowErrors: [],
            canImport: false,
        })),
        on(StoreActions.columnsLoaded, (state, action) => ({
            ...state,
            columns: [...action.columns],
            cellContents: [],
            working: false,
            rowErrors: [],
            canImport: false,
        })),
        on(StoreActions.setCellContents, (state, action) => ({
            ...state,
            cellContents: [...action.contents],
            rowErrors: [],
            canImport: false,
        })),
        on(StoreActions.testRowsInBackend, (state, action) => ({
            ...state,
            working: true,
            rowErrors: [],
            canImport: false,
        })),
        on(StoreActions.importRowsInBackend, (state, action) => ({
            ...state,
            working: true,
            rowErrors: [],
        })),
        on(StoreActions.setRowErrors, (state, action) => ({
            ...state,
            working: false,
            rowErrors: [...action.errors],
            canImport: action.errors.length === 0,
        })),
        on(StoreActions.backendTestSuccessful, (state, action) => ({
            ...state,
            canImport: true,
        })),
    )(appState, appAction);
}

