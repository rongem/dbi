import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

import { readRuntimeConfig } from '../config/runtime-config.js';
import { HttpError } from '../models/rest-api/httpError.model.js';
import { getLocale } from '../utils/locales.function.js';

/**
 * Ensures the request is authenticated as a user with write privileges and that previous express-validator checks passed before the controller logic proceeds.
 */
export const validate = (req: Request, res: Response, next: NextFunction) => {
    const env = readRuntimeConfig();
    const errors = validationResult(req);
    if (req.userAuthorized !== true) {
        return next(new HttpError(403, getLocale(env.locale).userWithoutWritePrivilegesError, { errors }));
    }
    if (errors.isEmpty()) {
        return next();
    }
    return next(new HttpError(400, getLocale(env.locale).validationError, errors));
};

