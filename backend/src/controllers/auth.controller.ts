import { Request, Response, NextFunction } from 'express';

import { readRuntimeConfig } from '../config/runtime-config.js';
import { resolveAuthenticatedUser } from '../services/auth.service.js';
import { createCsrfToken } from '../services/csrf-token.service.js';


export const getAuthentication = async (req: Request, res: Response, next: NextFunction) => {
    const user = await resolveAuthenticatedUser(req.ntlm);
    req.userAuthorized = user.isAuthorized;
    req.userName = user.name;
    next();
};

export const getAuthorization = async (req: Request, res: Response) => {
    const env = readRuntimeConfig();
    const csrfToken = req.userAuthorized === true && req.userName ? createCsrfToken(req.userName) : undefined;
    const user = {
        name: req.userName ?? 'unknown',
        isAuthorized: req.userAuthorized === true,
        databaseName: env.dbName,
        csrfToken,
    };
    res.json({
        success: true,
        data: user,
    });
};
