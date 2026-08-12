import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

import { readRuntimeConfig } from '../config/runtime-config.js';
import { logger } from '../utils/logger.js';

const tokenTtlMs = 60 * 60 * 1000;
const fallbackSecret = randomBytes(32).toString('hex');
let fallbackSecretLogged = false;

const base64UrlEncode = (value: string) => Buffer.from(value, 'utf8').toString('base64url');
const base64UrlDecode = (value: string) => Buffer.from(value, 'base64url').toString('utf8');

/**
 * Resolves the effective secret for CSRF signatures. It prefers the configured secret and falls back to a generated in-memory value only for local/dev safety.
 */
const resolveCsrfSecret = () => {
    const env = readRuntimeConfig();
    if (env.csrfSecret) {
        return env.csrfSecret;
    }
    if (!fallbackSecretLogged) {
        logger.warn('csrf_secret_fallback_used');
        fallbackSecretLogged = true;
    }
    return fallbackSecret;
};

/**
 * Creates a HMAC signature for a base64url-encoded token payload using the current effective CSRF secret.
 */
const createSignature = (payload: string, secret: string) => {
    return createHmac('sha256', secret).update(payload).digest('base64url');
};

/**
 * Generates a signed CSRF token that binds a username and expiry time together so the backend can verify later requests without storing the token server-side.
 */
export const createCsrfToken = (userName: string, now: number = Date.now()): string => {
    const payload = JSON.stringify({
        userName,
        expiresAt: now + tokenTtlMs,
    });
    const encodedPayload = base64UrlEncode(payload);
    const signature = createSignature(encodedPayload, resolveCsrfSecret());
    return `${encodedPayload}.${signature}`;
};

/**
 * Validates a signed CSRF token by recomputing the HMAC, checking the username and expiry, and guarding against timing attacks.
 */
export const isCsrfTokenValid = (token: string, userName: string, now: number = Date.now()): boolean => {
    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature) {
        return false;
    }

    const expectedSignature = createSignature(encodedPayload, resolveCsrfSecret());
    const expectedBuffer = Buffer.from(expectedSignature);
    const providedBuffer = Buffer.from(signature);
    if (expectedBuffer.length !== providedBuffer.length) {
        return false;
    }
    if (!timingSafeEqual(expectedBuffer, providedBuffer)) {
        return false;
    }

    try {
        const parsed = JSON.parse(base64UrlDecode(encodedPayload)) as { userName?: string; expiresAt?: number };
        if (parsed.userName !== userName) {
            return false;
        }
        if (!parsed.expiresAt || parsed.expiresAt <= now) {
            return false;
        }
        return true;
    } catch {
        return false;
    }
};
