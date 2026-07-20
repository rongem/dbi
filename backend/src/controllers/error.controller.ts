import { Request, Response, NextFunction } from 'express';

import { readRuntimeConfig } from '../config/runtime-config.js';
import { HttpError } from '../models/rest-api/httpError.model.js';
import { getLocale } from '../utils/locales.function.js';
import { logger } from '../utils/logger.js';

export type ErrorResponse = {
    status: number;
    body: {
        message: string;
        data?: unknown;
    };
};

export function error404(req: Request, res: Response, next: NextFunction) {
    res.sendStatus(404);
}

const env = readRuntimeConfig();

export const notFoundError = new HttpError(404, getLocale(env.locale).unknownUrlError);

export const normalizeError = (error: unknown): ErrorResponse => {
    if (error instanceof HttpError) {
        return {
            status: error.httpStatusCode,
            body: {
                message: error.message,
                data: error.data,
            },
        };
    }

    if (error instanceof Error) {
        return {
            status: 500,
            body: {
                message: error.message,
            },
        };
    }

    return {
        status: 500,
        body: {
            message: typeof error === 'string' ? error : String(error),
        },
    };
};

export const sendErrorResponse = (res: Response, error: unknown) => {
    const normalized = normalizeError(error);
    return res.status(normalized.status).json(normalized.body);
};
