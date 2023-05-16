import { CustomValidator, param } from 'express-validator';
import { escape } from 'tsqlstring'
import { retrieveTableNames } from '../controllers/table.controller';

const sqlStringValidator: CustomValidator = (value: string) => value === escape(value);

export const schemaValidator = param('schemaName')
    .exists().withMessage('SchemaName nicht vorhanden')
    .notEmpty().withMessage('SchemaName nicht vorhanden')
    .isString().withMessage('SchemaName muss ein String sein')
    .custom(sqlStringValidator).withMessage('SchemaName enthält ungültige Zeichen')
    .bail({level: 'request'})
    .trim();

const tableValidator = param('tableName')
    .exists().withMessage('TableName nicht vorhanden')
    .notEmpty().withMessage('TableName nicht vorhanden').bail()
    .isString().withMessage('TableName muss ein String sein').bail()
    .custom(sqlStringValidator).withMessage('TableName enthält ungültige Zeichen')
    .bail({level: 'request'})
    .trim()
    .custom(async (value: string, { req}) => {
        const schemaName = req.params!.schemaName.toLocaleLowerCase();
        const tableName = value.toLocaleLowerCase();
        const tables = await retrieveTableNames();
        if (!tables.some(t => t.name.toLocaleLowerCase() === tableName && t.schema.toLocaleLowerCase() === schemaName)) {
            throw new Error('Kombination aus Tabellenname und SchemaName nicht vorhanden');
        }
    });

export const allValidators = [schemaValidator, tableValidator];

