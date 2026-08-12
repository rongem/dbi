import { NextFunction, Request, Response } from 'express';

import { HttpError } from '../models/rest-api/httpError.model.js';
import { getLocale } from '../utils/locales.function.js';
import { getReadConfig, type ReadConfigDependency } from '../services/service-ports.js';

type CounterEntry = {
    windowStart: number;
    count: number;
};

const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const counters = new Map<string, CounterEntry>();

/**
 * Determines the rate-limit identity for a request based on the authenticated username, IP address, or a fallback value.
 */
const getRequesterKey = (req: Request) => req.userName || req.ip || 'anonymous';

/**
 * Removes rate-limit counters whose time window has already expired so stale entries do not accumulate indefinitely.
 */
const removeExpiredEntries = (threshold: number) => {
    for (const [key, entry] of counters.entries()) {
        if (entry.windowStart < threshold) {
            counters.delete(key);
        }
    }
};

/**
 * Enforces a sliding-window request cap for state-changing methods. It tracks requests per user or client, prunes expired counters,
 * and returns a 429 response once the configured threshold is exceeded within the active time window.
 */
export const enforceWriteRateLimit = (dependencies?: ReadConfigDependency) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const env = getReadConfig(dependencies)();
        if (!env.writeRateLimitEnabled || !unsafeMethods.has(req.method.toLocaleUpperCase())) {
            return next();
        }

        const now = Date.now();
        const key = getRequesterKey(req);
        const existing = counters.get(key);
        const withinWindow = existing && now - existing.windowStart < env.writeRateLimitWindowMs;
        const entry: CounterEntry = withinWindow
            ? { windowStart: existing.windowStart, count: existing.count + 1 }
            : { windowStart: now, count: 1 };

        counters.set(key, entry);

        if (counters.size > 5000) {
            removeExpiredEntries(now - env.writeRateLimitWindowMs * 2);
        }

        if (entry.count > env.writeRateLimitMaxRequests) {
            const retryAfterSeconds = Math.max(1, Math.ceil((entry.windowStart + env.writeRateLimitWindowMs - now) / 1000));
            res.setHeader('Retry-After', String(retryAfterSeconds));
            return next(new HttpError(429, getLocale(env.locale).tooManyRequestsError, {
                retryAfterSeconds,
            }));
        }

        return next();
    };
};
