/// <reference path="../../custom_types/node-test/index.d.ts" />

import type { RuntimeConfig } from './runtime-config.js';
import { validateRuntimeConfig } from './validate-runtime-config.js';

const createConfig = (overrides?: Partial<RuntimeConfig>): RuntimeConfig => ({
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
    csrfSecret: 'a-sufficiently-long-csrf-secret-value',
    writeRateLimitEnabled: true,
    writeRateLimitWindowMs: 60000,
    writeRateLimitMaxRequests: 60,
    ...overrides,
});

it('rejects AUTH_MODE none in production', async () => {
    try {
        validateRuntimeConfig(createConfig({ nodeEnv: 'production', authMode: 'none' }));
        expect(true).toBe(false);
    } catch (error: any) {
        expect(error.message).toContain('not allowed in production');
    }
});

it('rejects production origin protection without allow list', async () => {
    try {
        validateRuntimeConfig(createConfig({ nodeEnv: 'production', allowedOrigins: [] }));
        expect(true).toBe(false);
    } catch (error: any) {
        expect(error.message).toContain('ALLOWED_ORIGINS');
    }
});

it('rejects production csrf protection without secret', async () => {
    try {
        validateRuntimeConfig(createConfig({ nodeEnv: 'production', csrfSecret: '' }));
        expect(true).toBe(false);
    } catch (error: any) {
        expect(error.message).toContain('CSRF_SECRET');
    }
});

it('accepts hardened production config', async () => {
    validateRuntimeConfig(createConfig({ nodeEnv: 'production' }));
    expect(true).toBe(true);
});

it('rejects non-positive write rate limit window', async () => {
    try {
        validateRuntimeConfig(createConfig({ writeRateLimitWindowMs: 0 }));
        expect(true).toBe(false);
    } catch (error: any) {
        expect(error.message).toContain('WRITE_RATE_LIMIT_WINDOW_MS');
    }
});

it('rejects non-positive write rate limit request count', async () => {
    try {
        validateRuntimeConfig(createConfig({ writeRateLimitMaxRequests: 0 }));
        expect(true).toBe(false);
    } catch (error: any) {
        expect(error.message).toContain('WRITE_RATE_LIMIT_MAX_REQUESTS');
    }
});

it('rejects csrf secret shorter than 32 characters', async () => {
    try {
        validateRuntimeConfig(createConfig({ csrfSecret: 'short' }));
        expect(true).toBe(false);
    } catch (error: any) {
        expect(error.message).toContain('32');
    }
});

it('rejects invalid URL in allowed origins', async () => {
    try {
        validateRuntimeConfig(createConfig({ allowedOrigins: ['not-a-valid-url'] }));
        expect(true).toBe(false);
    } catch (error: any) {
        expect(error.message).toContain('not-a-valid-url');
    }
});
