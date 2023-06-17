import { CustomValidator, body, param, checkExact } from 'express-validator';
import SqlString from 'tsqlstring'
import { retrieveTableNames } from '../controllers/table.controller';
import { Row } from '../models/data/row.model';
import { selectColumns } from '../models/mssql/columns.model';
import { ColumnObject } from '../models/data/column-object.model';
import { rowsDescriptor, schemaDescriptor, tableDescriptor } from '../utils/params.descriptors';
import { getLocale } from '../utils/locales.function';

const sqlStringValidator: CustomValidator = (value: string) => `'${value}'` === SqlString.escape(value);


const schemaNameValidator = param(schemaDescriptor)
    .exists().withMessage(getLocale().schemaNotPresentError)
    .notEmpty().withMessage(getLocale().schemaIsEmptyError)
    .isString().withMessage(getLocale().schemaNotAStringError)
    .custom(sqlStringValidator).withMessage(getLocale().schemaContainsIllegalCharactersError)
    .bail({level: 'request'})
    .trim();

const tableNameValidator = param(tableDescriptor)
    .exists().withMessage(getLocale().tableNotPresentError)
    .notEmpty().withMessage(getLocale().tableEmptyError).bail()
    .isString().withMessage(getLocale().tableNotAStringError).bail()
    .custom(sqlStringValidator).withMessage(getLocale().tableContainsIllegalCharactersError)
    .bail({level: 'request'})
    .trim()
    .custom(async (value: string, { req}) => {
        const schemaName = req.params!.schemaName.toLocaleLowerCase();
        const tableName = value.toLocaleLowerCase();
        const tables = await retrieveTableNames();
        if (!tables.some(t => t.name.toLocaleLowerCase() === tableName && t.schema.toLocaleLowerCase() === schemaName)) {
            throw new Error(getLocale().tableNotFoundError);
        }
    })
    .bail({level: 'request'});

export const allParamValidators = checkExact([schemaNameValidator, tableNameValidator]);

const tableRowsArrayValidator = body(rowsDescriptor)
    .isArray().withMessage(getLocale().rowsIsNotAnArrayError).bail({level: 'request'})
    .isArray({min: 1, max: 10000}).withMessage(getLocale().rowNumberExceedsBoundariesError).bail({level: 'request'})
    .custom(async (value: Row[], {req}) => {
        const sqlColumns = await selectColumns(req.params![schemaDescriptor], req.params![tableDescriptor]);
        if (!sqlColumns || sqlColumns.length === 0) {
            throw new Error(getLocale().tableNotFoundError);
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
                errors.push(getLocale().requiredColumnMissingError(sqlColumn.name));
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
                errors.push(getLocale().columnIsNotPartOfTheTableError(key));
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
