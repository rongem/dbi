import { CustomValidator, body, param, checkExact } from 'express-validator';
import SqlString from 'tsqlstring'
import { readRuntimeConfig } from '../config/runtime-config.js';
import { Row } from '../models/data/row.model.js';
import { ColumnObject } from '../models/data/column-object.model.js';
import { getTableColumns, listTables } from '../services/table.service.js';
import { rowsDescriptor, schemaDescriptor, tableDescriptor } from '../utils/params.descriptors.js';
import { getLocale } from '../utils/locales.function.js';
import { Column } from '../models/data/column.model.js';

const sqlStringValidator: CustomValidator = (value: string) => `'${value}'` === SqlString.escape(value);
const env = readRuntimeConfig();
const locale = getLocale(env.locale);


const schemaNameValidator = param(schemaDescriptor)
    .exists().withMessage(locale.schemaNotPresentError)
    .notEmpty().withMessage(locale.schemaIsEmptyError)
    .isString().withMessage(locale.schemaNotAStringError)
    .custom(sqlStringValidator).withMessage(locale.schemaContainsIllegalCharactersError)
    .bail({level: 'request'})
    .trim();

const tableNameValidator = param(tableDescriptor)
    .exists().withMessage(locale.tableNotPresentError)
    .notEmpty().withMessage(locale.tableEmptyError).bail()
    .isString().withMessage(locale.tableNotAStringError).bail()
    .custom(sqlStringValidator).withMessage(locale.tableContainsIllegalCharactersError)
    .bail({level: 'request'})
    .trim()
    .custom(async (value: string, { req}) => {
        const schemaName = req.params!.schemaName.toLocaleLowerCase();
        const tableName = value.toLocaleLowerCase();
        const tables = await listTables();
        if (!tables.some(t => t.name.toLocaleLowerCase() === tableName && t.schema.toLocaleLowerCase() === schemaName)) {
            throw new Error(locale.tableNotFoundError);
        }
    })
    .bail({level: 'request'});

export const allParamValidators = checkExact([schemaNameValidator, tableNameValidator]);

const tableRowsArrayValidator = body(rowsDescriptor)
    .isArray().withMessage(locale.rowsIsNotAnArrayError).bail({level: 'request'})
    .isArray({min: 1, max: 10000}).withMessage(locale.rowNumberExceedsBoundariesError).bail({level: 'request'})
    .custom(async (value: Row[], {req}) => {
        const sqlColumns = await getTableColumns(req.params![schemaDescriptor], req.params![tableDescriptor]);
        if (!sqlColumns || sqlColumns.length === 0) {
            throw new Error(locale.tableNotFoundError);
        }
        const sqlColumnObject: ColumnObject = {};
        const sqlColumnNames: string[] = [];
        for (let sqlColumn of sqlColumns) {
            const name = sqlColumn.name.toLocaleLowerCase();
            sqlColumnObject[name] = sqlColumn;
            sqlColumnNames.push(name);
        }
        req.sqlColumnObject = sqlColumnObject;
        req.sqlColumnNames = sqlColumnNames;
    }).bail({level: 'request'});

const tableRowsContentValidator = body(`${rowsDescriptor}.*`)
    .custom((row: Row, {req}) => {
        const sqlColumnObject = req.sqlColumnObject as ColumnObject;
        const sqlColumnNames = req.sqlColumnNames as string[];
        const rowKeys = Object.keys(row).map(k => k.toLocaleLowerCase());
        const errors: string[] = [];
        for (let columName of sqlColumnNames) {
            const sqlColumn = sqlColumnObject[columName];
            const rowKey = rowKeys.find(k => k === columName);
            if (!rowKey && !(sqlColumn.hasDefaultValue || sqlColumn.isNullable)) {
                errors.push(locale.requiredColumnMissingError(sqlColumn.name));
            }
        }
        if (errors.length > 0) {
            throw new Error(errors.join(' '));
        }
        return true;
    })
    .custom((row: Row, {req}) => {
        const sqlColumnObject = req.sqlColumnObject as ColumnObject;
        const sqlColumnNames = req.sqlColumnNames as string[];
        const rowKeys = Object.keys(row);
        const errors: string[] = [];
        for (let key of rowKeys) {
            if (!sqlColumnNames.includes(key.toLocaleLowerCase())) {
                errors.push(locale.columnIsNotPartOfTheTableError(key));
            } else {
                const column = sqlColumnObject[key.toLocaleLowerCase()]!;
                const cell = row[key];
                if (!isCellCompatibleWithColumn(cell, column)) {
                    errors.push(locale.typeIsNotAllowedForColumError(typeof cell, column.name));
                }
            }
        }
        if (errors.length > 0) {
            throw new Error(errors.join(' '));
        }
        return true;
    }).bail({level: 'request'});

export const tableImportValidator = checkExact([schemaNameValidator, tableNameValidator, tableRowsArrayValidator, tableRowsContentValidator]);

export function isCellCompatibleWithColumn(cell: unknown, column: Column): boolean {
    if (cell === null || cell === undefined) {
        return column.isNullable;
    }

    const allowedTypes = getAllowedTypes(column);
    const compatibleWithType = isCompatibleWithAllowedTypes(cell, allowedTypes);
    if (!compatibleWithType) {
        return false;
    }

    const constraints = column.constraints;
    if (!constraints) {
        return true;
    }

    if (constraints.enumValues && constraints.enumValues.length > 0 && !constraints.enumValues.includes(cell as string | number | boolean)) {
        return false;
    }

    if (typeof cell === 'string') {
        const minLength = constraints.string?.minLength;
        const maxLength = constraints.string?.maxLength;
        if (minLength !== undefined && cell.length < minLength) {
            return false;
        }
        if (maxLength !== undefined && cell.length > maxLength) {
            return false;
        }

        if (constraints.binary?.maxBytes !== undefined) {
            const bytes = Buffer.byteLength(cell, 'utf8');
            if (bytes > constraints.binary.maxBytes) {
                return false;
            }
        }
    }

    if (typeof cell === 'number' && Number.isFinite(cell)) {
        const minimum = constraints.number?.minimum;
        const maximum = constraints.number?.maximum;
        if (minimum !== undefined && cell < minimum) {
            return false;
        }
        if (maximum !== undefined && cell > maximum) {
            return false;
        }
        if (constraints.number?.integer === true && !Number.isInteger(cell)) {
            return false;
        }
    }

    return true;
}

function getAllowedTypes(column: Column): Array<'boolean' | 'date' | 'number' | 'string' | 'binary'> {
    const fromConstraints = column.constraints?.logicalTypes;
    if (fromConstraints && fromConstraints.length > 0) {
        return fromConstraints;
    }
    return column.typeInfo.allowedTypes;
}

function isCompatibleWithAllowedTypes(cell: unknown, allowedTypes: Array<'boolean' | 'date' | 'number' | 'string' | 'binary'>): boolean {
    if (allowedTypes.length === 0) {
        return true;
    }

    if (allowedTypes.includes('boolean') && typeof cell === 'boolean') {
        return true;
    }
    if (allowedTypes.includes('number') && typeof cell === 'number' && Number.isFinite(cell)) {
        return true;
    }
    if (allowedTypes.includes('string') && typeof cell === 'string') {
        return true;
    }
    if (allowedTypes.includes('date')) {
        if (cell instanceof Date && !isNaN(cell.getTime())) {
            return true;
        }
        if (typeof cell === 'string' && !isNaN(Date.parse(cell))) {
            return true;
        }
    }
    if (allowedTypes.includes('binary') && typeof cell === 'string') {
        return true;
    }

    return false;
}
