import { requestPromise } from '../db';
import { sqlGetColumnInformationForSchemaAndTable, sqlGetColumnKeyInformation, sqlGetForeignColumnInformation, sqlGetReferantialConstraints } from '../../utils/sql.templates';
import { Column } from '../data/column.model';
import { NVarChar } from 'mssql';
import { getTypeInformation } from '../data/typeshelper';

export const selectColumns = async (schema: string, table: string) => {
    const sqlColumns = await fetchColumnData(schema, table);
    const sqlColumnInformations = await fetchColumnKeyInformations(schema, table);
    const sqlReferences = await fetchReferantialContraints(schema);
    const sqlReferenceTargets = sqlReferences.recordset.map(r => ({
        constraint: r.CONSTRAINT_NAME as string,
        schema,
        uniqueConstraint: r.UNIQUE_CONSTRAINT_NAME as string,
        uniqueSchema: r.UNIQUE_CONSTRAINT_SCHEMA as string,
    }));
    const columns: Column[] = sqlColumns.recordset.map((sqlColumn => createColumn({table, schema, sqlColumn})));
    for (let c of columns) {
        const columnInfos = sqlColumnInformations.recordset.filter(r => r.COLUMN_NAME === c.name);
        for (let columnInfo of columnInfos) {
            if (columnInfo.Primary === 1) c.primary = true;
            if (columnInfo.Unique === 1) c.unique = true;
            if (columnInfo.Foreign === 1) {
                c.foreignKey = true;
                const sqlReferenceTarget = sqlReferenceTargets.find(t => t.constraint === columnInfo.CONSTRAINT_NAME);
                if (sqlReferenceTarget) {
                    const foreignColumn = await fetchForeignColumnInformation(sqlReferenceTarget.schema, sqlReferenceTarget.constraint);
                    if (foreignColumn.recordset.length === 1) {
                        c.foreignKeyInformation = {
                            column: foreignColumn.recordset[0].COLUMN_NAME,
                            table: foreignColumn.recordset[0].TABLE_NAME,
                            schema: foreignColumn.recordset[0].TABLE_SCHEMA,
                        }
                    } else {
                        console.error(foreignColumn.recordset);
                    }
                }
            }
        }
    }
    return columns;
};

function createColumn(columnData: {table: string, schema: string, sqlColumn: any}) {
    const {schema, sqlColumn} = columnData;
    const c: Column = {
        table: {
            name: columnData.table,
            schema
        },
        dataType: sqlColumn.DATA_TYPE,
        hasDefaultValue: !!sqlColumn.COLUMN_DEFAULT,
        isNullable: sqlColumn.IS_NULLABLE === 'YES',
        name: sqlColumn.COLUMN_NAME,
        ordinalPosition: sqlColumn.ORDINAL_POSITION,
        typeInfo: getTypeInformation(sqlColumn.DATA_TYPE),
        primary: false,
        foreignKey: false,
        unique: false,
    };
    if (c.typeInfo.allowedTypes.includes('string')) {
        c.characterData = {
            characterSetName: sqlColumn.CHARACTER_SET_NAME,
            collationName: sqlColumn.COLLATION_NAME,
            maximumCharacterLength: sqlColumn.CHARACTER_MAXIMUM_LENGTH
        };
    }
    if (c.typeInfo.allowedTypes.includes('number')) {
        c.numericData = {
            numericPrecision: sqlColumn.NUMERIC_PRECISION,
            numericScale: sqlColumn.NUMERIC_SCALE,
        };
    }
    return c;
}

async function fetchColumnData(schema: string, table: string) {
    const req = await createTableRequest(schema, table);
    const result = await req.query(sqlGetColumnInformationForSchemaAndTable);
    return result;
}

async function fetchColumnKeyInformations(schema: string, table: string) {
    const req = await createTableRequest(schema, table);
    const result = await req.query(sqlGetColumnKeyInformation);
    return result;
}

async function createTableRequest(schema: string, table: string) {
    const req = await requestPromise();
    req.input('Table_Schema', NVarChar(), schema);
    req.input('Table_Name', NVarChar(), table);
    return req;
}

async function fetchReferantialContraints(schema: string) {
    const req = await requestPromise();
    req.input('Table_Schema', NVarChar(), schema);
    const result = await req.query(sqlGetReferantialConstraints);
    return result;
}

async function fetchForeignColumnInformation(schema: string, constraint: string) {
    const req = await requestPromise();
    req.input('Constraint_Schema', NVarChar(), schema);
    req.input('Constraint_Name', NVarChar(), constraint);
    const result = await req.query(sqlGetForeignColumnInformation);
    return result;
}

