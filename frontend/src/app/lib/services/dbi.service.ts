import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { User } from "../models/rest-backend/user.model";
import { Store } from "@ngrx/store";
import * as StoreActions from '../store/store.actions';
import { catchError, of, take } from "rxjs";
import { Table } from "../models/rest-backend/table.model";
import { Column } from "../models/rest-backend/column.model";

@Injectable({providedIn: 'root'})
export class DbiService {
    constructor(private http: HttpClient, private store: Store) {}

    retrieveUser = () => this.http.get<User>('/user').pipe(
        take(1),
        catchError(this.handleError),
    );

    loadTables = () => this.http.get<Table[]>('/tables').pipe(
        take(1),
        catchError(this.handleError),
    )

    loadColumns = (table: Table) => this.http.get<Column[]>(`/table/${table.schema}/${table.name}`).pipe(
        take(1),
        catchError(this.handleError),
    )

    // Überprüft Fehler beim Aufruf und meldet den Benutzer ab, wenn das Anmelde-Token nicht mehr gültig ist
    private handleError = (error: HttpErrorResponse) => {
        console.error(error);
        this.store.dispatch(StoreActions.setWorkingState({ working: false }));
        this.store.dispatch(StoreActions.setError({ error: error.message ?? error }));
        return of(undefined);
    }
}