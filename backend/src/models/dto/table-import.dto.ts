import type { Row } from '../data/row.model.js';

export type TableImportRequestDto = {
    schemaName: string;
    tableName: string;
    rows: Row[];
};

export type TableImportResultDto = {
    rowsInserted: number;
};