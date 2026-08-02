/// <reference path="../../custom_types/node-test/index.d.ts" />

import { createCsrfToken } from '../services/csrf-token.service.js';
import { enforceAllowedOriginsForUnsafeMethods, enforceCsrfTokenForUnsafeMethods } from './request-security.middleware.js';

const createNextSpy = () => {
    const calls: unknown[] = [];
    return {
        next: (error?: unknown) => {
            calls.push(error);
        },
        calls,
    };
};

const createConfig = () => ({
    nodeEnv: 'test',
    dbName: 'db',
    dbUser: 'user',
    dbPassword: 'pwd',
    dbServer: 'server',
    dbPort: '1433',
    appPort: '8000',
    dbInstance: '',
    authMode: 'ntlm',
    authTableName: '_Authorizations',
    locale: 'en',
    allowedOrigins: ['https://dbi.intra.local'],
    originProtectionEnabled: true,
    csrfProtectionEnabled: true,
    csrfSecret: 'unit-test-secret',
    writeRateLimitEnabled: true,
    writeRateLimitWindowMs: 60000,
    writeRateLimitMaxRequests: 60,
});

it('blocks unsafe request when origin header is missing', async () => {
    const { next, calls } = createNextSpy();
    enforceAllowedOriginsForUnsafeMethods({ readConfig: createConfig })(
        { method: 'POST', headers: {} } as any,
        {} as any,
        next as any,
    );

    expect(calls.length).toBe(1);
    expect((calls[0] as any).httpStatusCode).toBe(403);
});

it('allows unsafe request from configured origin', async () => {
    const { next, calls } = createNextSpy();
    enforceAllowedOriginsForUnsafeMethods({ readConfig: createConfig })(
        { method: 'PUT', headers: { origin: 'https://dbi.intra.local' } } as any,
        {} as any,
        next as any,
    );

    expect(calls.length).toBe(1);
    expect(calls[0]).toBeUndefined();
});

it('blocks unsafe request when csrf token header is missing', async () => {
    const { next, calls } = createNextSpy();
    enforceCsrfTokenForUnsafeMethods({ readConfig: createConfig })(
        {
            method: 'POST',
            userName: 'domain\\michael',
            header: () => undefined,
        } as any,
        {} as any,
        next as any,
    );

    expect(calls.length).toBe(1);
    expect((calls[0] as any).httpStatusCode).toBe(403);
});

it('allows unsafe request when csrf token is valid', async () => {
    process.env.CSRF_SECRET = 'unit-test-secret';
    const token = createCsrfToken('domain\\michael');
    const { next, calls } = createNextSpy();

    enforceCsrfTokenForUnsafeMethods({ readConfig: createConfig })(
        {
            method: 'POST',
            userName: 'domain\\michael',
            header: (name: string) => name.toLocaleLowerCase() === 'x-csrf-token' ? token : undefined,
        } as any,
        {} as any,
        next as any,
    );

    expect(calls.length).toBe(1);
    expect(calls[0]).toBeUndefined();
});
