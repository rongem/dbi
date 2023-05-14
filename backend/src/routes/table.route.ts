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
    .bail({level: 'request'});

const schemaTableValidator = param(['schemaName', 'tableName'])
    .custom(async (value: string[]) => {
        console.log(value);
        const schemaName = value[0].toLocaleLowerCase();
        const tableName = value[1].toLocaleLowerCase();
        const tables = await retrieveTableNames();
        if (!tables.some(t => t.name.toLocaleLowerCase() === tableName && t.schema.toLocaleLowerCase() === schemaName)) {
            throw new HttpError(404, 'Kombination aus Tabellenname und SchemaName nicht vorhanden');
        }
    })
    .bail({level: 'request'});

const allValidators = [schemaValidator, tableValidator, schemaTableValidator];

const router = express.Router();

router.get('/:schemaName/:tableName', allValidators, validate, retrieveTableColumns);

router.post('/:schemaName/:tableName', allValidators, validate);

export default router;
