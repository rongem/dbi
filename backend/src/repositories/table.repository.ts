import type { Column } from '../models/data/column.model.js';
import type { Row } from '../models/data/row.model.js';
import { selectColumns } from '../models/mssql/columns.model.js';
import { insertRows } from '../models/mssql/rows.model.js';
import { selectTables } from '../models/mssql/tables.model.js';

export type TableRepository = {
    listTables: () => Promise<Awaited<ReturnType<typeof selectTables>>>;
    getTableColumns: (schemaName: string, tableName: string) => Promise<Column[]>;
    insertTableRows: (data: {schemaName: string; tableName: string; rows: Row[]; columns: Column[]; commit: boolean}) => Promise<number>;
};

export const defaultTableRepository: TableRepository = {
    listTables: async () => selectTables(),
    getTableColumns: async (schemaName: string, tableName: string) => selectColumns(schemaName, tableName),
    insertTableRows: async (data) => insertRows(data),
};