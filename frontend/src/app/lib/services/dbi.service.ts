import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { take } from "rxjs";

import { ApiResponse } from "../models/api-response.model";
import { Column } from "../models/rest-backend/column.model";
import { RowContainer } from "../models/rest-backend/row-container.model";
import { Table } from "../models/rest-backend/table.model";
import { User } from "../models/rest-backend/user.model";

const API_BASE = '/api/v1';

@Injectable({providedIn: 'root'})
export class DbiService {
    constructor(private http: HttpClient) {}

    retrieveUser = () => this.http.get<ApiResponse<User>>(`${API_BASE}/user`).pipe(take(1));

    loadTables = () => this.http.get<ApiResponse<Table[]>>(`${API_BASE}/tables`).pipe(take(1));

    loadColumns = (table: Table) => this.http.get<ApiResponse<Column[]>>(`${API_BASE}/table/${table.schema}/${table.name}`).pipe(take(1));

    testRows = (content: RowContainer) => this.http.post<ApiResponse<{rowsInserted: number}>>(`${API_BASE}/table/${content.schema}/${content.table}`, {rows: content.rows}).pipe(take(1));

    importRows = (content: RowContainer) => this.http.put<ApiResponse<{rowsInserted: number}>>(`${API_BASE}/table/${content.schema}/${content.table}`, {rows: content.rows}).pipe(take(1));
}