import type { Column } from '../models/data/column.model.js';
import { selectColumns } from '../models/mssql/columns.model.js';
import { selectTables } from '../models/mssql/tables.model.js';

export const listTables = async () => {
    return selectTables();
};

export const getTableColumns = async (schemaName: string, tableName: string): Promise<Column[]> => {
    return selectColumns(schemaName, tableName);
};
