import { authorizationTableName } from '../utils/config.templates.js';

export type RuntimeConfig = {
    dbName: string;
    dbUser: string;
    dbPassword: string;
    dbServer: string;
    dbPort: string;
    dbInstance: string;
    authMode: string;
    authTableName: string;
    locale: string;
};

export const readRuntimeConfig = (): RuntimeConfig => ({
    dbName: process.env.DB_NAME?.trim() ?? '',
    dbUser: process.env.DB_USER?.trim() ?? '',
    dbPassword: process.env.DB_PWD?.trim() ?? '',
    dbServer: process.env.DB_SERVER?.trim() ?? '',
    dbPort: process.env.DB_PORT?.trim() ?? '1433',
    dbInstance: process.env.DB_INSTANCE?.trim() ?? '',
    authMode: process.env.AUTH_MODE?.trim().toLocaleLowerCase() ?? 'ntlm',
    authTableName: process.env.AUTH_TABLENAME?.trim() ?? authorizationTableName,
    locale: process.env.LOCALE?.trim().toLocaleLowerCase() ?? 'en',
});
