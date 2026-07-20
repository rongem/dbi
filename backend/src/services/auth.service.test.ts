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
            authMode: 'none',
            authTableName: 'auth',
            locale: 'en',
        }),
        readUserFn: async () => {
            throw new Error('should not be called');
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
            authMode: 'ntlm',
            authTableName: 'auth',
            locale: 'en',
        }),
        readUserFn: async () => {
            throw new Error('Invalid authentication.');
        },
    });

    expect(user).toStrictEqual({name: '', isAuthorized: false, databaseName: 'db'});
});

it('returns the requested authorization user', async () => {
    const user = await getUserAuthorization('domain\\michael', {
        readUserFn: async (name: string) => ({name, isAuthorized: true, databaseName: 'db'}),
    });

    expect(user.name).toBe('domain\\michael');
    expect(user.isAuthorized).toBe(true);
});