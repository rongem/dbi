import { Request, Response, NextFunction } from 'express';

import { readRuntimeConfig } from '../config/runtime-config.js';
import { resolveAuthenticatedUser } from '../services/auth.service.js';
import { createCsrfToken } from '../services/csrf-token.service.js';


/**
 * Resolves the current NTLM user and stores the authorization data on the request so downstream middleware can enforce access rules.
 */
export const getAuthentication = async (req: Request, res: Response, next: NextFunction) => {
    const user = await resolveAuthenticatedUser(req.ntlm);
    req.userAuthorized = user.isAuthorized;
    req.userName = user.name;
    next();
};

/**
 * Returns the current user state to the frontend, including whether the user is authorized and a CSRF token when the request is permitted.
 * The payload is intentionally minimal and safe to expose to the authenticated UI layer.
 */
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
