import express from 'express';
import { getAuthorization } from '../controllers/auth.controller';

const router = express.Router();

router.get('/', getAuthorization);

export default router;
