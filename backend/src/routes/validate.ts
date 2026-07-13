import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

import { HttpError } from '../models/rest-api/httpError.model.js';
import { getLocale } from '../utils/locales.function.js';
import { EnvironmentController } from '../controllers/environment.controller.js';

export const validate = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (req.userAuthorized !== true) {
        return next(new HttpError(403, getLocale(EnvironmentController.instance.locale).userWithoutWritePrivilegesError, { errors }));
    }
    if (errors.isEmpty()) {
        return next();
    }
    return next(new HttpError(400, getLocale(EnvironmentController.instance.locale).validationError, errors));
};

