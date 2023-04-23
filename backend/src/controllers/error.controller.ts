import { Request, Response, NextFunction } from 'express';

import { HttpError } from '../models/rest-api/httpError.model';

export function error404(req: Request, res: Response, next: NextFunction) {
    res.sendStatus(404);
}

export const notFoundError = new HttpError(404, 'URL ist unbekannt');

export function serverError(next: NextFunction, error: any) {
    if (!error) { console.log('should not be here'); return; }
    if (error instanceof HttpError) {
        next(error);
    }  else {
        next(new HttpError(500, error));
    }
}
