import { Request, Response, NextFunction } from 'express';

import { readRuntimeConfig } from '../config/runtime-config.js';
import { HttpError } from '../models/rest-api/httpError.model.js';
import { getLocale } from '../utils/locales.function.js';
import { logger } from '../utils/logger.js';

export type ErrorResponse = {
    status: number;
    body: {
        success: false;
        error: {
            message: string;
            details?: unknown;
        };
    };
};

export function error404(req: Request, res: Response, next: NextFunction) {
    res.sendStatus(404);
}

const env = readRuntimeConfig();

export const notFoundError = new HttpError(404, getLocale(env.locale).unknownUrlError);

export const normalizeError = (error: unknown): ErrorResponse => {
    const locale = getLocale(env.locale);

    if (error instanceof HttpError) {
        if (error.httpStatusCode >= 500) {
            return {
                status: 500,
                body: {
                    success: false,
                    error: {
                        message: locale.internalServerError,
                    },
                },
            };
        }
        return {
            status: error.httpStatusCode,
            body: {
                success: false,
                error: {
                    message: error.message,
                    details: error.data,
                },
            },
        };
    }

    if (error instanceof Error) {
        return {
            status: 500,
            body: {
                success: false,
                error: {
                    message: locale.internalServerError,
                },
            },
        };
    }

    return {
        status: 500,
        body: {
            success: false,
            error: {
                message: typeof error === 'string' ? error : String(error),
            },
        },
    };
};

export const sendErrorResponse = (req: Request, res: Response, error: unknown) => {
    const statusCode = error instanceof HttpError ? error.httpStatusCode : 500;
    const logPayload = {
        statusCode,
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl,
        userName: req.userName,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
    };

    if (statusCode >= 500) {
        logger.error('request_failed', logPayload);
    } else {
        logger.warn('request_failed', logPayload);
    }

    const normalized = normalizeError(error);
    return res.status(normalized.status).json(normalized.body);
};
