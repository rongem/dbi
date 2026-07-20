import express from 'express';
import { getHealth, getReadiness } from '../controllers/health.controller.js';

const router = express.Router();

router.get('/healthz', getHealth);
router.get('/readyz', getReadiness);

export default router;