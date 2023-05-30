import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';

import * as StoreActions from './store.actions';
import { DbiService } from '../services/dbi.service';
import { ErrorList } from '../models/rest-backend/errorlist.model';

@Injectable()
export class StoreEffects {
    retrieveUser$ = createEffect(() => this.actions$.pipe(
        ofType(StoreActions.retrieveUser),
        switchMap(() => this.dbi.retrieveUser()),
        map(user => StoreActions.setUser(user)),
        catchError(this.handleError),
    ));

    setUser$ = createEffect(() => this.actions$.pipe(
        ofType(StoreActions.setUser),
        map(() => StoreActions.loadTables()),
        catchError(this.handleError),
    ));

    loadTables$ = createEffect(() => this.actions$.pipe(
        ofType(StoreActions.loadTables),
        switchMap(() => this.dbi.loadTables()),
        map(tables => StoreActions.tablesLoaded({tables})),
        catchError(this.handleError),
    ));

    selectTable$ = createEffect(() => this.actions$.pipe(
        ofType(StoreActions.selectTable),
        switchMap(table => this.dbi.loadColumns(table)),
        map(columns => StoreActions.columnsLoaded({columns})),
        catchError(this.handleError),
    ));

    testRows$ = createEffect(() => this.actions$.pipe(
        ofType(StoreActions.testRowsInBackend),
        switchMap((action) => this.dbi.testRows(action.content)),
        map(() => StoreActions.backendTestSuccessful()),
        catchError(this.handleImportError),
    ));

    importRows$ = createEffect(() => this.actions$.pipe(
        ofType(StoreActions.importRowsInBackend),
        switchMap((action) => this.dbi.testRows(action.content)),
        map(() => StoreActions.setCellContents({contents: []})),
        catchError(this.handleImportError),
    ));

    constructor(private actions$: Actions,
        private dbi: DbiService) {}

    private handleImportError = (error: HttpErrorResponse) => {
        const errors = error.error.data as ErrorList[];
        console.log(errors);
        return of(StoreActions.setRowErrors({errors}));
    }
    
    private handleError = (error: HttpErrorResponse) => {
        console.error(error);
        return of(StoreActions.setError({ error: error.message ?? error }));
    }

}