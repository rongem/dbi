import { requestPromise } from '../db';
import { sqlGetAllTableNamesCurrentUserHasRights } from '../../utils/sql.templates';
import { Table } from '../data/table.model';
import { EnvironmentController } from '../../controllers/environment.controller';

export const selectTables = async () => {
    const req = await requestPromise();
    const result = await req.query(sqlGetAllTableNamesCurrentUserHasRights);
    const tables: Table[] = result.recordset.filter(r => r.TABLE_NAME !== EnvironmentController.instance.authTableName).map(record => ({
        name: record.TABLE_NAME,
        schema: record.TABLE_SCHEMA
    }));
    return tables;
}
