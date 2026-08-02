/// <reference path="../../custom_types/node-test/index.d.ts" />

import { resolveAuthenticatedUser, getUserAuthorization } from './auth.service.js';

it('resolves anonymous auth when auth mode is none', async () => {
    const user = await resolveAuthenticatedUser(undefined, {
        readConfig: () => ({
            dbName: 'db',
            dbUser: 'user',
            dbPassword: 'pwd',
            dbServer: 'server',
            dbPort: '1433',
            appPort: '8000',
            dbInstance: '',
            nodeEnv: 'test',
            authMode: 'none',
            authTableName: 'auth',
            locale: 'en',
            allowedOrigins: [],
            originProtectionEnabled: false,
            csrfProtectionEnabled: false,
            csrfSecret: '',
            writeRateLimitEnabled: false,
            writeRateLimitWindowMs: 60000,
            writeRateLimitMaxRequests: 60,
        }),
        repository: {
            readUser: async () => {
                throw new Error('should not be called');
            },
        },
    });

    expect(user).toStrictEqual({name: 'none', isAuthorized: true, databaseName: 'db'});
});

it('maps illegal authentication to unauthorized user', async () => {
    const user = await resolveAuthenticatedUser({UserName: 'michael', DomainName: 'domain'}, {
        readConfig: () => ({
            dbName: 'db',
            dbUser: 'user',
            dbPassword: 'pwd',
            dbServer: 'server',
            dbPort: '1433',
            appPort: '8000',
            dbInstance: '',
            nodeEnv: 'test',
            authMode: 'ntlm',
            authTableName: 'auth',
            locale: 'en',
            allowedOrigins: ['https://dbi.intra.local'],
            originProtectionEnabled: true,
            csrfProtectionEnabled: true,
            csrfSecret: 'secret',
            writeRateLimitEnabled: true,
            writeRateLimitWindowMs: 60000,
            writeRateLimitMaxRequests: 60,
        }),
        repository: {
            readUser: async () => {
                throw new Error('Invalid authentication.');
            },
        },
    });

    expect(user).toStrictEqual({name: '', isAuthorized: false, databaseName: 'db'});
});

it('returns the requested authorization user', async () => {
    const user = await getUserAuthorization('domain\\michael', {
        repository: {
            readUser: async (name: string) => ({name, isAuthorized: true, databaseName: 'db'}),
        },
    });

    expect(user.name).toBe('domain\\michael');
    expect(user.isAuthorized).toBe(true);
});