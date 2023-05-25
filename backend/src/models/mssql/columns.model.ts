import { requestPromise } from '../db';
import { sqlGetColumnInformationForSchemaAndTable, sqlGetColumnKeyInformation } from '../../utils/sql.templates';
import { Column } from '../data/column.model';
import { NVarChar } from 'mssql';
import { getTypeInformation } from '../data/typeshelper';

export const selectColumns = async (schema: string, table: string) => {
    const req1 = await requestPromise();
    req1.input('Table_Schema', NVarChar(), schema);
    req1.input('Table_Name', NVarChar(), table);
    const result1 = await req1.query(sqlGetColumnInformationForSchemaAndTable);
    const req2 = await requestPromise();
    req2.input('Table_Schema', NVarChar(), schema);
    req2.input('Table_Name', NVarChar(), table);
    const result2 = await req2.query(sqlGetColumnKeyInformation);
    const columns: Column[] = result1.recordset.map((r => {
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
            primary: false,
            foreignKey: false,
            unique: false,
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
        const columnInfos = result2.recordset.filter(r => r.COLUMN_NAME === c.name);
        for (let columnInfo of columnInfos) {
            if (columnInfo.Primary === 1) c.primary = true;
            if (columnInfo.Foreign === 1) c.foreignKey = true;
            if (columnInfo.Unique === 1) c.unique = true;
        }
        return c;
    }));
    return columns;
};
