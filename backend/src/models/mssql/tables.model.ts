import { readRuntimeConfig } from '../../config/runtime-config.js';
import { requestPromise } from '../db.js';
import { sqlGetAllTableNamesCurrentUserHasRights } from '../../utils/sql.templates.js';
import { Table } from '../data/table.model.js';

export const selectTables = async () => {
    const env = readRuntimeConfig();
    const req = await requestPromise();
    const result = await req.query(sqlGetAllTableNamesCurrentUserHasRights);
    const tables: Table[] = result.recordset.filter(r => r.TABLE_NAME !== env.authTableName).map(record => ({
        name: record.TABLE_NAME,
        schema: record.TABLE_SCHEMA
    }));
    return tables;
}
