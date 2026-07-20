import express from 'express';
import { commitTableRows, previewTableRows, retrieveAndSendTableColumns } from '../controllers/table.controller.js';
import { validate } from './validate.js';
import { allParamValidators, tableImportValidator } from './validators.js';

const router = express.Router();

router.get('/:schemaName/:tableName', allParamValidators, validate, retrieveAndSendTableColumns);

router.post('/:schemaName/:tableName', tableImportValidator, validate, previewTableRows);
router.put('/:schemaName/:tableName', tableImportValidator, validate, commitTableRows);

export default router;
