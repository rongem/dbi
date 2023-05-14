import express from 'express';
import { retrieveTables } from '../controllers/tables.controller';

const router = express.Router();

router.get('/', retrieveTables);

export default router;
