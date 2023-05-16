import express from 'express';
import { retrieveTableColumns } from '../controllers/table.controller';
import { validate } from './validate';
import { allValidators } from './validators';

const router = express.Router();

router.get('/:schemaName/:tableName', allValidators, validate, retrieveTableColumns);

router.post('/:schemaName/:tableName', allValidators, validate);

export default router;
