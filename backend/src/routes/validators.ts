import { CustomValidator, body, param, checkExact } from 'express-validator';
import SqlString from 'tsqlstring'
import { readRuntimeConfig } from '../config/runtime-config.js';
import { Row } from '../models/data/row.model.js';
import { ColumnObject } from '../models/data/column-object.model.js';
import { getTableColumns, listTables } from '../services/table.service.js';
import { rowsDescriptor, schemaDescriptor, tableDescriptor } from '../utils/params.descriptors.js';
import { getLocale } from '../utils/locales.function.js';

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
                if (!column.typeInfo.allowedTypes.includes(typeof cell)) {
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
