import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';

import { Table } from '../models/rest-backend/table.model';
import { AppStore } from '../store/app-store.service';

@Injectable({providedIn: 'root'})
class TablesResolver {
    resolve(): Observable<Table[]> {
        if (this.store.tablesLoaded()) {
            return of(this.store.tables());
        }

        return this.store.loadTables();
    }

    constructor(private readonly store: AppStore) {}
}
export const resolveTables: ResolveFn<Table[]> = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) =>
    inject(TablesResolver).resolve();
