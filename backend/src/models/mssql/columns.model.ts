import sql, { NVarChar } from 'mssql';

import { requestPromise } from '../db.js';
import { sqlGetColumnInformationForSchemaAndTable, sqlGetColumnKeyInformation, sqlGetForeignColumnInformation, sqlGetReferantialConstraints } from '../../utils/sql.templates.js';
import { Column } from '../data/column.model.js';
import { ColumnConstraints } from '../data/column-constraints.model.js';
import { getTypeInformation } from '../data/tsTypeInfo.js';
import { logger } from '../../utils/logger.js';

const { TYPES } = sql;

/**
 * Loads all column metadata for a table, enriches it with key information, and resolves foreign-key references into a normalized column model.
 * The method keeps the raw SQL metadata and the generic constraint summary together so the API can expose a backend-neutral contract.
 */
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
                        logger.warn('foreign_column_lookup_ambiguous', {recordset: foreignColumn.recordset});
                    }
                }
            }
        }
    }
    return columns;
};

function createColumn(columnData: {table: string, schema: string, sqlColumn: any}) {
    const {schema, sqlColumn} = columnData;
    const typeInfo = getTypeInformation(sqlColumn.DATA_TYPE);
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
        typeInfo,
        constraints: createColumnConstraints(sqlColumn.DATA_TYPE, typeInfo.allowedTypes, sqlColumn),
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

/**
 * Maps SQL column metadata to the generic constraint contract used by the API and frontend validation.
 * It populates logical type hints, enum-like limits, numeric ranges, and text or binary length constraints derived from MSSQL metadata.
 */
function createColumnConstraints(
    sqlType: string,
    logicalTypes: Array<'boolean' | 'date' | 'number' | 'string' | 'binary'>,
    sqlColumn: any,
): ColumnConstraints {
    const constraints: ColumnConstraints = {
        logicalTypes,
    };

    if (logicalTypes.includes('string')) {
        const maxLength = toFiniteNumber(sqlColumn.CHARACTER_MAXIMUM_LENGTH);
        if (maxLength !== undefined && maxLength >= 0) {
            constraints.string = { maxLength };
        }
    }

    if (logicalTypes.includes('binary')) {
        const maxBytes = toFiniteNumber(sqlColumn.CHARACTER_MAXIMUM_LENGTH);
        if (maxBytes !== undefined && maxBytes >= 0) {
            constraints.binary = { maxBytes };
        }
    }

    if (logicalTypes.includes('number')) {
        const numberConstraints = {
            minimum: undefined as number | undefined,
            maximum: undefined as number | undefined,
            integer: undefined as boolean | undefined,
            precision: toFiniteNumber(sqlColumn.NUMERIC_PRECISION),
            scale: toFiniteNumber(sqlColumn.NUMERIC_SCALE),
        };

        switch ((sqlType ?? '').toLocaleLowerCase()) {
            case 'tinyint':
                numberConstraints.minimum = 0;
                numberConstraints.maximum = 255;
                numberConstraints.integer = true;
                break;
            case 'smallint':
                numberConstraints.minimum = -32768;
                numberConstraints.maximum = 32767;
                numberConstraints.integer = true;
                break;
            case 'int':
                numberConstraints.minimum = -2147483648;
                numberConstraints.maximum = 2147483647;
                numberConstraints.integer = true;
                break;
        }

        if (numberConstraints.scale !== undefined) {
            numberConstraints.integer = numberConstraints.scale === 0;
        }

        if (
            numberConstraints.minimum !== undefined ||
            numberConstraints.maximum !== undefined ||
            numberConstraints.integer !== undefined ||
            numberConstraints.precision !== undefined ||
            numberConstraints.scale !== undefined
        ) {
            constraints.number = numberConstraints;
        }
    }

    return constraints;
}

function toFiniteNumber(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }
    return undefined;
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
    req.input('Table_Schema', TYPES.NVarChar, schema);
    req.input('Table_Name', TYPES.NVarChar, table);
    return req;
}

async function fetchReferantialContraints(schema: string) {
    const req = await requestPromise();
    req.input('Table_Schema', TYPES.NVarChar, schema);
    const result = await req.query(sqlGetReferantialConstraints);
    return result;
}

async function fetchForeignColumnInformation(schema: string, constraint: string) {
    const req = await requestPromise();
    req.input('Constraint_Schema', TYPES.NVarChar, schema);
    req.input('Constraint_Name', TYPES.NVarChar, constraint);
    const result = await req.query(sqlGetForeignColumnInformation);
    return result;
}

