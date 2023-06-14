import { CustomValidator, body, param, checkExact } from 'express-validator';
import SqlString from 'tsqlstring'
import { retrieveTableNames } from '../controllers/table.controller';
import { Row } from '../models/data/row.model';
import { selectColumns } from '../models/mssql/columns.model';
import { ColumnObject } from '../models/data/column-object.model';

const sqlStringValidator: CustomValidator = (value: string) => `'${value}'` === SqlString.escape(value);

const schemaNameValidator = param('schemaName')
    .exists().withMessage('SchemaName not present')
    .notEmpty().withMessage('SchemaName is emtpy')
    .isString().withMessage('SchemaName must be of type string')
    .custom(sqlStringValidator).withMessage('SchemaName contains illegal characters')
    .bail({level: 'request'})
    .trim();

const tableNameValidator = param('tableName')
    .exists().withMessage('TableName not present')
    .notEmpty().withMessage('TableName is empty').bail()
    .isString().withMessage('TableName must be of type string').bail()
    .custom(sqlStringValidator).withMessage('TableName contains illegal characters')
    .bail({level: 'request'})
    .trim()
    .custom(async (value: string, { req}) => {
        const schemaName = req.params!.schemaName.toLocaleLowerCase();
        const tableName = value.toLocaleLowerCase();
        const tables = await retrieveTableNames();
        if (!tables.some(t => t.name.toLocaleLowerCase() === tableName && t.schema.toLocaleLowerCase() === schemaName)) {
            throw new Error('No table with that name found in that schema');
        }
    })
    .bail({level: 'request'});

export const allParamValidators = checkExact([schemaNameValidator, tableNameValidator]);

const tableRowsArrayValidator = body('rows')
    .isArray().withMessage('rows is not an array').bail({level: 'request'})
    .isArray({min: 1, max: 10000}).withMessage('rows contains less than 1 oder more than 10000 items').bail({level: 'request'})
    .custom(async (value: Row[], {req}) => {
        const sqlColumns = await selectColumns(req.params!['schemaName'], req.params!['tableName']);
        if (!sqlColumns || sqlColumns.length === 0) {
            throw new Error('No table with that name found in that schema');
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

const tableRowsContentValidator = body('rows.*')
    .custom((row: Row, {req}) => {
        const sqlColumnObject = req.sqlColumnObject as ColumnObject;
        const sqlColumnNames = req.sqlColumnNames as string[];
        const rowKeys = Object.keys(row).map(k => k.toLocaleLowerCase());
        const errors: string[] = [];
        for (let columName of sqlColumnNames) {
            const sqlColumn = sqlColumnObject[columName];
            const rowKey = rowKeys.find(k => k === columName);
            if (!rowKey && !(sqlColumn.hasDefaultValue || sqlColumn.isNullable)) {
                errors.push('Required column ' + sqlColumn.name + ' is missing.');
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
                errors.push('Column ' + key + ' is not part of the table.');
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
