import { NextFunction, Request, Response } from 'express';

import { HttpError } from '../models/rest-api/httpError.model.js';
import { getLocale } from '../utils/locales.function.js';
import { getReadConfig, type ReadConfigDependency } from '../services/service-ports.js';
import { isCsrfTokenValid } from '../services/csrf-token.service.js';

const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const normalizeOrigin = (originValue: string) => {
    return new URL(originValue).origin.toLocaleLowerCase();
};

export const enforceAllowedOriginsForUnsafeMethods = (dependencies?: ReadConfigDependency) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const env = getReadConfig(dependencies)();
        if (!env.originProtectionEnabled || !unsafeMethods.has(req.method.toLocaleUpperCase())) {
            return next();
        }

        const originValue = req.headers.origin;
        if (!originValue || Array.isArray(originValue)) {
            return next(new HttpError(403, getLocale(env.locale).forbiddenOriginError));
        }

        try {
            const requestOrigin = normalizeOrigin(originValue);
            if (!env.allowedOrigins.includes(requestOrigin)) {
                return next(new HttpError(403, getLocale(env.locale).forbiddenOriginError, { origin: requestOrigin }));
            }
            return next();
        } catch {
            return next(new HttpError(403, getLocale(env.locale).forbiddenOriginError));
        }
    };
};

export const enforceCsrfTokenForUnsafeMethods = (dependencies?: ReadConfigDependency) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const env = getReadConfig(dependencies)();
        if (!env.csrfProtectionEnabled || !unsafeMethods.has(req.method.toLocaleUpperCase())) {
            return next();
        }

        const token = req.header('x-csrf-token');
        if (!token) {
            return next(new HttpError(403, getLocale(env.locale).missingCsrfTokenError));
        }

        if (!req.userName || !isCsrfTokenValid(token, req.userName)) {
            return next(new HttpError(403, getLocale(env.locale).invalidCsrfTokenError));
        }

        return next();
    };
};
