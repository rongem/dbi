import { requestPromise } from '../db';
import { sqlGetColumnInformationForSchemaAndTable } from '../../utils/sql.templates';
import { Column } from '../data/column.model';
import { NVarChar } from 'mssql';
import { getTypeInformation } from '../data/typeshelper';

export const selectColumns = async (schema: string, table: string) => {
    const req = await requestPromise;
    req.input('Table_Schema', NVarChar(), schema);
    req.input('Table_Name', NVarChar(), table);
    const result = await req.query(sqlGetColumnInformationForSchemaAndTable);
    const columns: Column[] = result.recordset.map((r => {
        const c: Column = {
            table: {
                name: table,
                schema
            },
            dataType: r.DATA_TYPE,
            hasDefaultValue: !!r.COLUMN_DEFAULT,
            isNullable: r.IS_NULLABLE === 'YES',
            name: r.COLUMN_NAME,
            ordinalPosition: r.ORDINAL_POSITION,
            typeInfo: getTypeInformation(r.DATA_TYPE),
        };
        if (c.typeInfo.allowedTypes.includes('string')) {
            c.characterData = {
                characterSetName: r.CHARACTER_SET_NAME,
                collationName: r.COLLATION_NAME,
                maximumCharacterLength: r.CHARACTER_MAXIMUM_LENGTH
            };
        }
        if (c.typeInfo.allowedTypes.includes('number')) {
            c.numericData = {
                numericPrecision: r.NUMERIC_PRECISION,
                numericScale: r.NUMERIC_SCALE,
            };
        }
        return c;
    }));
    return columns;
};
