import { Request, Response, NextFunction } from 'express';

import { HttpError } from '../models/rest-api/httpError.model.js';
import { getUserAuthorization, resolveAuthenticatedUser } from '../services/auth.service.js';
import { serverError } from './error.controller.js';


export const getAuthentication = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await resolveAuthenticatedUser(req.ntlm);
        req.userAuthorized = user.isAuthorized;
        req.userName = user.name;
        next();
    } catch (error: any) {
        serverError(next, error);
    }
};

export const getAuthorization = (req: Request, res: Response, next: NextFunction) => {
    getUserAuthorization(req.userName ?? 'test').then(user => {
        res.json(user);
    }).catch((error: HttpError) => res.status(error.httpStatusCode).json({
        error: error.message,
        data: error.data,
    }));
};
