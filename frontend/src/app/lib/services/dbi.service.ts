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
/**
 * Centralizes the HTTP calls to the backend API and exposes a small typed interface for user lookup, table metadata loading, and row preview/import requests.
 */
export class DbiService {
    constructor(private http: HttpClient) {}

    /**
     * Loads the current authenticated user state including authorization information and a CSRF token when available.
     */
    retrieveUser = () => this.http.get<ApiResponse<User>>(`${API_BASE}/user`).pipe(take(1));

    /**
     * Loads the available schemas and table metadata from the backend for the current user session.
     */
    loadTables = () => this.http.get<ApiResponse<Table[]>>(`${API_BASE}/tables`).pipe(take(1));

    /**
     * Fetches the column metadata for a selected table so the frontend can render type hints and validation constraints.
     */
    loadColumns = (table: Table) => this.http.get<ApiResponse<Column[]>>(`${API_BASE}/table/${encodeURIComponent(table.schema)}/${encodeURIComponent(table.name)}`).pipe(take(1));

    /**
     * Sends a dry-run validation payload to the backend to check whether the current rows are structurally and semantically valid before a real import occurs.
     */
    testRows = (content: RowContainer) => this.http.post<ApiResponse<{rowsInserted: number}>>(`${API_BASE}/table/${encodeURIComponent(content.schema)}/${encodeURIComponent(content.table)}`, {rows: content.rows}).pipe(take(1));

    /**
     * Commits the validated row set to the target database table and returns the number of inserted rows from the backend response.
     */
    importRows = (content: RowContainer) => this.http.put<ApiResponse<{rowsInserted: number}>>(`${API_BASE}/table/${encodeURIComponent(content.schema)}/${encodeURIComponent(content.table)}`, {rows: content.rows}).pipe(take(1));
}