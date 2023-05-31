import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, RouterStateSnapshot } from '@angular/router';
import { Store } from '@ngrx/store';
import { iif, switchMap, tap } from 'rxjs';

import * as StoreActions from '../store/store.actions';
import * as StoreSelectors from '../store/store.selectors';
import { Table } from '../models/rest-backend/table.model';
import { DbiService } from '../services/dbi.service';

@Injectable({providedIn: 'root'})
class TablesResolver {
    resolve() {
        return this.store.select(StoreSelectors.tablesLoaded).pipe(
            switchMap(loaded => iif(() => loaded,
                this.store.select(StoreSelectors.tables),
                this.dbi.loadTables().pipe(tap(tables => this.store.dispatch(StoreActions.tablesLoaded({tables}))))
            ))
        );
    }
    constructor(private store: Store, private dbi: DbiService) {}
}
export const resolveTables: ResolveFn<Table[]> = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) =>
    inject(TablesResolver).resolve();
