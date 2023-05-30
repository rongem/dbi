import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { User } from "../models/rest-backend/user.model";
import { Store } from "@ngrx/store";
import { take } from "rxjs";
import { Table } from "../models/rest-backend/table.model";
import { Column } from "../models/rest-backend/column.model";
import { RowContainer } from "../models/rest-backend/row-container.model";

@Injectable({providedIn: 'root'})
export class DbiService {
    constructor(private http: HttpClient, private store: Store) {}

    retrieveUser = () => this.http.get<User>('/user').pipe(take(1));

    loadTables = () => this.http.get<Table[]>('/tables').pipe(take(1));

    loadColumns = (table: Table) => this.http.get<Column[]>(`/table/${table.schema}/${table.name}`).pipe(take(1));

    testRows = (content: RowContainer) => this.http.post<{rowsInserted: number}>(`/table/${content.schema}/${content.table}`, {rows: content.rows}).pipe(take(1));

    importRows = (content: RowContainer) => this.http.put<{rowsInserted: number}>(`/table/${content.schema}/${content.table}`, {rows: content.rows}).pipe(take(1));
}