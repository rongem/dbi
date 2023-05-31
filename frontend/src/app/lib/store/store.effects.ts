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
        switchMap(() => this.dbi.retrieveUser().pipe(
            map(user => StoreActions.setUser(user)),
            catchError(this.handleError),
        )),
    ));

    selectTable$ = createEffect(() => this.actions$.pipe(
        ofType(StoreActions.selectTable),
        switchMap(table => this.dbi.loadColumns(table).pipe(
            map(columns => StoreActions.columnsLoaded({columns})),
            catchError(this.handleError),
        )),
    ));

    testRows$ = createEffect(() => this.actions$.pipe(
        ofType(StoreActions.testRowsInBackend),
        switchMap((action) => this.dbi.testRows(action.content).pipe(
            map(() => StoreActions.backendTestSuccessful()),
            catchError(this.handleImportError),
        )),
    ));

    importRows$ = createEffect(() => this.actions$.pipe(
        ofType(StoreActions.importRowsInBackend),
        switchMap((action) => this.dbi.importRows(action.content).pipe(
            map(result => StoreActions.importSuccessful({importedRows: result.rowsInserted})),
            catchError(this.handleImportError),
        )),
    ));

    constructor(private actions$: Actions,
        private dbi: DbiService) {}

    private handleImportError = (error: HttpErrorResponse) => {
        const errors = error.error.data as ErrorList[];
        return of(StoreActions.setRowErrors({errors}));
    }
    
    private handleError = (error: HttpErrorResponse) => {
        console.error(error);
        return of(StoreActions.setError({ error: error.message ?? error }));
    }

}