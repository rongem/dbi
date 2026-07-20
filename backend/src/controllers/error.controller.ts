import { Request, Response, NextFunction } from 'express';

import { readRuntimeConfig } from '../config/runtime-config.js';
import { HttpError } from '../models/rest-api/httpError.model.js';
import { getLocale } from '../utils/locales.function.js';

export function error404(req: Request, res: Response, next: NextFunction) {
    res.sendStatus(404);
}

const env = readRuntimeConfig();

export const notFoundError = new HttpError(404, getLocale(env.locale).unknownUrlError);

export function serverError(next: NextFunction, error: any) {
    if (!error) { console.log('should never be here'); return; }
    if (error instanceof HttpError) {
        next(error);
    }  else {
        next(new HttpError(500, error));
    }
}
