/// <reference path="../../custom_types/node-test/index.d.ts" />

import { enforceWriteRateLimit } from './write-rate-limit.middleware.js';

const createConfig = (overrides?: Record<string, any>) => ({
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
    writeRateLimitMaxRequests: 2,
    ...overrides,
});

const createResponse = () => {
    const headers: Record<string, string> = {};
    return {
        headers,
        setHeader: (name: string, value: string) => {
            headers[name] = value;
        },
    } as any;
};

it('allows writes below configured limit', async () => {
    const middleware = enforceWriteRateLimit({ readConfig: () => createConfig() as any });
    const nextCalls: unknown[] = [];
    const req = { method: 'POST', userName: 'domain\\michael', ip: '127.0.0.1' } as any;

    middleware(req, createResponse(), (error?: unknown) => nextCalls.push(error));
    middleware(req, createResponse(), (error?: unknown) => nextCalls.push(error));

    expect(nextCalls.length).toBe(2);
    expect(nextCalls[0]).toBeUndefined();
    expect(nextCalls[1]).toBeUndefined();
});

it('blocks writes above configured limit with retry header', async () => {
    const middleware = enforceWriteRateLimit({ readConfig: () => createConfig() as any });
    const req = { method: 'PUT', userName: 'domain\\rate-limit', ip: '127.0.0.1' } as any;
    const firstRes = createResponse();
    const secondRes = createResponse();
    const thirdRes = createResponse();
    let thirdError: any;

    middleware(req, firstRes, () => undefined);
    middleware(req, secondRes, () => undefined);
    middleware(req, thirdRes, (error?: unknown) => {
        thirdError = error;
    });

    expect(thirdError.httpStatusCode).toBe(429);
    expect(thirdRes.headers['Retry-After']).toBeDefined();
});
