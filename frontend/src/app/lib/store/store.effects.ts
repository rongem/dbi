import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap, tap } from 'rxjs';

import * as StoreActions from './store.actions';
import * as StoreSelectors from './store.selectors';
import { DbiService } from '../services/dbi.service';

@Injectable()
export class StoreEffects {
    retrieveUser$ = createEffect(() => this.actions$.pipe(
        ofType(StoreActions.retrieveUser),
        switchMap(() => this.dbi.retrieveUser()),
        map(user => {
            if (user) {
                this.store.dispatch(StoreActions.setUser(user));
            }
        }),
    ), {dispatch: false});

    setUser$ = createEffect(() => this.actions$.pipe(
        ofType(StoreActions.setUser),
        map(() => StoreActions.loadTables()),
    ));

    loadTables$ = createEffect(() => this.actions$.pipe(
        ofType(StoreActions.loadTables),
        switchMap(() => this.dbi.loadTables()),
        map(tables => {
            if (tables) {
                this.store.dispatch(StoreActions.tablesLoaded({tables}));
            }
        })
    ), {dispatch: false});

    selectTable$ = createEffect(() => this.actions$.pipe(
        ofType(StoreActions.selectTable),
        switchMap(table => this.dbi.loadColumns(table)),
        map(columns => {
            if (columns) {
                console.log(columns);
                this.store.dispatch(StoreActions.columnsLoaded({columns}));
            }
        })
    ), {dispatch: false});

    constructor(private actions$: Actions,
        private store: Store,
        private dbi: DbiService) {}
}