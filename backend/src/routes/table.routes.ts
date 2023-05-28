import express from 'express';
import { retrieveAndSendTableColumns, saveTableRows, testTableRows } from '../controllers/table.controller';
import { validate } from './validate';
import { allParamValidators, tableImportValidator } from './validators';

const router = express.Router();

router.get('/:schemaName/:tableName', allParamValidators, validate, retrieveAndSendTableColumns);

router.post('/:schemaName/:tableName', tableImportValidator, validate, testTableRows);
router.put('/:schemaName/:tableName', tableImportValidator, validate, saveTableRows);

export default router;
