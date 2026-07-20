import type { Row } from '../models/data/row.model.js';
import { insertRows } from '../models/mssql/rows.model.js';
import { getTableColumns } from './table.service.js';

export type TableImportRequest = {
    schemaName: string;
    tableName: string;
    rows: Row[];
    commit: boolean;
};

export const executeTableImport = async (data: TableImportRequest) => {
    const columns = await getTableColumns(data.schemaName, data.tableName);
    return insertRows({...data, columns});
};