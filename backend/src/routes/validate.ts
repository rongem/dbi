import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

import { HttpError } from '../models/rest-api/httpError.model';
import { getLocale } from '../utils/locales.function';

export const validate = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (req.userAuthorized !== true) {
        return next(new HttpError(403, getLocale().userWithoutWritePrivilegesError, { errors }));
    }
    if (errors.isEmpty()) {
        return next();
    }
    return next(new HttpError(400, getLocale().validationError, errors));
};

