import express from 'express';
import { param } from 'express-validator';
import { retrieveTableColumns, retrieveTableNames } from '../controllers/table.controller';
import { HttpError } from '../models/rest-api/httpError.model';
import { validate } from './validate';

const schemaValidator = param('schemaName')
    .exists().withMessage('SchemaName nicht vorhanden')
    .notEmpty().withMessage('SchemaName nicht vorhanden').bail()
    .isString().withMessage('SchemaName muss ein String sein').bail()
    .trim()
    .bail({level: 'request'});

const tableValidator = param('tableName')
    .exists().withMessage('TableName nicht vorhanden')
    .notEmpty().withMessage('TableName nicht vorhanden').bail()
    .isString().withMessage('TableName muss ein String sein').bail()
    .trim()
    .bail({level: 'request'})
    .custom(async (value: string, { req}) => {
        const schemaName = req.params!.schemaName.toLocaleLowerCase();
        const tableName = value.toLocaleLowerCase();
        const tables = await retrieveTableNames();
        if (!tables.some(t => t.name.toLocaleLowerCase() === tableName && t.schema.toLocaleLowerCase() === schemaName)) {
            throw new Error('Kombination aus Tabellenname und SchemaName nicht vorhanden');
        }
    });

const schemaTableValidator = param(['schemaName', 'tableName'])
    .bail({level: 'request'});

const allValidators = [schemaValidator, tableValidator, schemaTableValidator];

const router = express.Router();

router.get('/:schemaName/:tableName', allValidators, validate, retrieveTableColumns);

router.post('/:schemaName/:tableName', allValidators, validate);

export default router;
