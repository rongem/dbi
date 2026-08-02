/// <reference path="../../custom_types/node-test/index.d.ts" />

import { setSecurityHeaders } from './security-headers.middleware.js';

it('sets default security headers', async () => {
    const headers: Record<string, string> = {};
    const req = {
        secure: false,
        header: () => undefined,
    } as any;
    const res = {
        setHeader: (name: string, value: string) => {
            headers[name] = value;
        },
    } as any;
    let nextCalled = false;

    setSecurityHeaders(req, res, () => {
        nextCalled = true;
    });

    expect(nextCalled).toBe(true);
    expect(headers['Content-Security-Policy']).toBe("default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(headers['Permissions-Policy']).toBe('camera=(), microphone=(), geolocation=()');
    expect(headers['Cross-Origin-Opener-Policy']).toBe('same-origin');
    expect(headers['Strict-Transport-Security']).toBeUndefined();
});

it('sets HSTS header for https requests', async () => {
    const headers: Record<string, string> = {};
    const req = {
        secure: false,
        header: (name: string) => name.toLocaleLowerCase() === 'x-forwarded-proto' ? 'https' : undefined,
    } as any;
    const res = {
        setHeader: (name: string, value: string) => {
            headers[name] = value;
        },
    } as any;

    setSecurityHeaders(req, res, () => undefined);

    expect(headers['Strict-Transport-Security']).toBe('max-age=31536000; includeSubDomains');
});
