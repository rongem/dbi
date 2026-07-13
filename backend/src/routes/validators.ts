import { CustomValidator, body, param, checkExact } from 'express-validator';
import SqlString from 'tsqlstring'
import { retrieveTableNames } from '../controllers/table.controller.js';
import { Row } from '../models/data/row.model.js';
import { selectColumns } from '../models/mssql/columns.model.js';
import { ColumnObject } from '../models/data/column-object.model.js';
import { rowsDescriptor, schemaDescriptor, tableDescriptor } from '../utils/params.descriptors.js';
import { getLocale } from '../utils/locales.function.js';
import { EnvironmentController } from '../controllers/environment.controller.js';

const sqlStringValidator: CustomValidator = (value: string) => `'${value}'` === SqlString.escape(value);


const schemaNameValidator = param(schemaDescriptor)
    .exists().withMessage(getLocale(EnvironmentController.instance.locale).schemaNotPresentError)
    .notEmpty().withMessage(getLocale(EnvironmentController.instance.locale).schemaIsEmptyError)
    .isString().withMessage(getLocale(EnvironmentController.instance.locale).schemaNotAStringError)
    .custom(sqlStringValidator).withMessage(getLocale(EnvironmentController.instance.locale).schemaContainsIllegalCharactersError)
    .bail({level: 'request'})
    .trim();

const tableNameValidator = param(tableDescriptor)
    .exists().withMessage(getLocale(EnvironmentController.instance.locale).tableNotPresentError)
    .notEmpty().withMessage(getLocale(EnvironmentController.instance.locale).tableEmptyError).bail()
    .isString().withMessage(getLocale(EnvironmentController.instance.locale).tableNotAStringError).bail()
    .custom(sqlStringValidator).withMessage(getLocale(EnvironmentController.instance.locale).tableContainsIllegalCharactersError)
    .bail({level: 'request'})
    .trim()
    .custom(async (value: string, { req}) => {
        const schemaName = req.params!.schemaName.toLocaleLowerCase();
        const tableName = value.toLocaleLowerCase();
        const tables = await retrieveTableNames();
        if (!tables.some(t => t.name.toLocaleLowerCase() === tableName && t.schema.toLocaleLowerCase() === schemaName)) {
            throw new Error(getLocale(EnvironmentController.instance.locale).tableNotFoundError);
        }
    })
    .bail({level: 'request'});

export const allParamValidators = checkExact([schemaNameValidator, tableNameValidator]);

const tableRowsArrayValidator = body(rowsDescriptor)
    .isArray().withMessage(getLocale(EnvironmentController.instance.locale).rowsIsNotAnArrayError).bail({level: 'request'})
    .isArray({min: 1, max: 10000}).withMessage(getLocale(EnvironmentController.instance.locale).rowNumberExceedsBoundariesError).bail({level: 'request'})
    .custom(async (value: Row[], {req}) => {
        const sqlColumns = await selectColumns(req.params![schemaDescriptor], req.params![tableDescriptor]);
        if (!sqlColumns || sqlColumns.length === 0) {
            throw new Error(getLocale(EnvironmentController.instance.locale).tableNotFoundError);
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
                errors.push(getLocale(EnvironmentController.instance.locale).requiredColumnMissingError(sqlColumn.name));
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
                errors.push(getLocale(EnvironmentController.instance.locale).columnIsNotPartOfTheTableError(key));
            } else {
                const column = sqlColumnObject[key.toLocaleLowerCase()]!;
                const cell = row[key];
                if (!column.typeInfo.allowedTypes.includes(typeof cell)) {
                    errors.push('Type ' + typeof row[key] + ' is not allowed for column ' + column.name + '.');
                }
            }
        }
        if (errors.length > 0) {
            throw new Error(errors.join(' '));
        }
        return true;
    }).bail({level: 'request'});

export const tableImportValidator = checkExact([schemaNameValidator, tableNameValidator, tableRowsArrayValidator, tableRowsContentValidator]);
