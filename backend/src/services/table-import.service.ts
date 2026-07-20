import type { Row } from '../models/data/row.model.js';
import { insertRows } from '../models/mssql/rows.model.js';
import { getTableColumns } from './table.service.js';

type TableImportRequest = {
    schemaName: string;
    tableName: string;
    rows: Row[];
};

type TableImportDependencies = {
    getColumns?: typeof getTableColumns;
    insertRowsFn?: typeof insertRows;
};

const getDependencies = (dependencies?: TableImportDependencies) => ({
    getColumns: dependencies?.getColumns ?? getTableColumns,
    insertRowsFn: dependencies?.insertRowsFn ?? insertRows,
});

const executeTableImport = async (data: TableImportRequest, commit: boolean, dependencies?: TableImportDependencies) => {
    const { getColumns, insertRowsFn } = getDependencies(dependencies);
    const columns = await getColumns(data.schemaName, data.tableName);
    return insertRowsFn({...data, columns, commit});
};

export const previewTableImport = async (data: TableImportRequest, dependencies?: TableImportDependencies) => {
    return executeTableImport(data, false, dependencies);
};

export const commitTableImport = async (data: TableImportRequest, dependencies?: TableImportDependencies) => {
    return executeTableImport(data, true, dependencies);
};