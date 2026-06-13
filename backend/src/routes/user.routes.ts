import express from 'express';
import { getAuthorization } from '../controllers/auth.controller.js';

const router = express.Router();

router.get('/', getAuthorization);

export default router;
