import { CustomValidator, body, param, checkExact } from 'express-validator';
import SqlString from 'tsqlstring'
import { retrieveTableNames } from '../controllers/table.controller';
import { Row } from '../models/data/row.model';
import { selectColumns } from '../models/mssql/columns.model';

const sqlStringValidator: CustomValidator = (value: string) => `'${value}'` === SqlString.escape(value);

const schemaValidator = param('schemaName')
    .exists().withMessage('SchemaName not present')
    .notEmpty().withMessage('SchemaName is emtpy')
    .isString().withMessage('SchemaName must be of type string')
    .custom(sqlStringValidator).withMessage('SchemaName contains illegal characters')
    .bail({level: 'request'})
    .trim();

const tableValidator = param('tableName')
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

export const allParamValidators = checkExact([schemaValidator, tableValidator]);

const tableRowsValidator = body('rows')
    .isArray().withMessage('rows is not an array').bail()
    .isArray({min: 1, max: 10000}).withMessage('rows contains less than 1 oder more than 10000 items').bail()
    .custom((value: Row[]) => {
        const rowKeyNames: string[] = [];
        for (let row of value) {
            const keyNames = keyNamesToChain(row);
            rowKeyNames.push(keyNames);
        }
        if ([...new Set(rowKeyNames)].length !== 1) {
            return false;
        }
        return true;
    }).withMessage('Rows with differing key names found in body.').bail()
    .custom(async (value: Row[], {req}) => {
        const sqlColumns = await selectColumns(req.params!['schemaName'], req.params!['tableName']);
        if (!sqlColumns || sqlColumns.length === 0) {
            throw new Error('No table with that name found in that schema');
        }
        const columnNames = sqlColumns.map(c => c.name.toLocaleLowerCase()).sort().join('|');
        for (let row of value) {
            if (keyNamesToChain(row) !== columnNames) {
                throw new Error('Key names of row ' + value.indexOf(row).toString() + ' are different from table.');
            }
            for (let col of sqlColumns) {
                const key = Object.keys(row).find(k => k.toLocaleLowerCase() === col.name.toLocaleLowerCase())!;
                const cell = row[key];
                if (!col.typeInfo.allowedTypes.includes(typeof cell)) {
                    throw new Error('Type ' + typeof cell + ' is not allowed for column ' + col.name);
                }
            }
        }
    }).bail();

const keyNamesToChain = (object: Object) => Object.keys(object).map(k => k.toLocaleLowerCase()).sort().join('|');

export const tableImportValidator = checkExact([schemaValidator, tableValidator, tableRowsValidator]);
