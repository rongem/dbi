import express from 'express';
import { retrieveTables } from '../controllers/tables.controller.js';

const router = express.Router();

router.get('/', retrieveTables);

export default router;
