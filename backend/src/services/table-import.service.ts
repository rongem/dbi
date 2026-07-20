import type { Row } from '../models/data/row.model.js';
import { insertRows } from '../models/mssql/rows.model.js';
import { getTableColumns } from './table.service.js';

type TableImportRequest = {
    schemaName: string;
    tableName: string;
    rows: Row[];
};

const executeTableImport = async (data: TableImportRequest, commit: boolean) => {
    const columns = await getTableColumns(data.schemaName, data.tableName);
    return insertRows({...data, columns, commit});
};

export const previewTableImport = async (data: TableImportRequest) => {
    return executeTableImport(data, false);
};

export const commitTableImport = async (data: TableImportRequest) => {
    return executeTableImport(data, true);
};