import type { Column } from '../models/data/column.model.js';
import type { Row } from '../models/data/row.model.js';
import { selectColumns } from '../models/mssql/columns.model.js';
import { insertRows } from '../models/mssql/rows.model.js';
import { selectTables } from '../models/mssql/tables.model.js';

export const listTables = async () => {
    return selectTables();
};

export const getTableColumns = async (schemaName: string, tableName: string): Promise<Column[]> => {
    return selectColumns(schemaName, tableName);
};

export const importTableRows = async (data: {schemaName: string, tableName: string, rows: Row[], commit: boolean}) => {
    const columns = await selectColumns(data.schemaName, data.tableName);
    return insertRows({...data, columns});
};