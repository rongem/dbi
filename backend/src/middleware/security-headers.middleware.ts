import { NextFunction, Request, Response } from 'express';

const ONE_YEAR_IN_SECONDS = 31536000;
const CONTENT_SECURITY_POLICY = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'";

/**
 * Detects whether the incoming request is using HTTPS, including proxied traffic forwarded via x-forwarded-proto.
 */
const isHttpsRequest = (req: Request) => {
    if (req.secure) return true;
    const forwardedProto = req.header('x-forwarded-proto');
    if (!forwardedProto) return false;
    const firstProto = forwardedProto.split(',')[0]?.trim().toLocaleLowerCase();
    return firstProto === 'https';
};

/**
 * Adds a hardened set of security headers to every response and enables HSTS only when the request is served via HTTPS.
 * This reduces the impact of common browser-side attacks and keeps the application aligned with a strict secure-default posture.
 */
export const setSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Content-Security-Policy', CONTENT_SECURITY_POLICY);
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

    if (isHttpsRequest(req)) {
        res.setHeader('Strict-Transport-Security', `max-age=${ONE_YEAR_IN_SECONDS}; includeSubDomains`);
    }

    next();
};
