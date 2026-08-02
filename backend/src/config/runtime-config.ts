import { authorizationTableName } from '../utils/config.templates.js';

export type RuntimeConfig = {
    nodeEnv: string;
    dbName: string;
    dbUser: string;
    dbPassword: string;
    dbServer: string;
    dbPort: string;
    appPort: string;
    dbInstance: string;
    authMode: string;
    authTableName: string;
    locale: string;
    allowedOrigins: string[];
    originProtectionEnabled: boolean;
    csrfProtectionEnabled: boolean;
    csrfSecret: string;
    writeRateLimitEnabled: boolean;
    writeRateLimitWindowMs: number;
    writeRateLimitMaxRequests: number;
};

const parseCsv = (value: string | undefined) => (value ?? '')
    .split(',')
    .map(item => item.trim())
    .filter(item => item.length > 0);

const parseBoolean = (value: string | undefined, fallback: boolean) => {
    if (value === undefined) return fallback;
    const normalized = value.trim().toLocaleLowerCase();
    if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
    return fallback;
};

const parseInteger = (value: string | undefined, fallback: number) => {
    if (!value) return fallback;
    const parsed = Number.parseInt(value.trim(), 10);
    if (Number.isNaN(parsed)) return fallback;
    return parsed;
};

export const readRuntimeConfig = (): RuntimeConfig => {
    const authMode = process.env.AUTH_MODE?.trim().toLocaleLowerCase() ?? 'ntlm';
    const nodeEnv = process.env.NODE_ENV?.trim().toLocaleLowerCase() ?? 'development';
    const allowedOrigins = parseCsv(process.env.ALLOWED_ORIGINS).map(origin => origin.toLocaleLowerCase());
    const originProtectionEnabled = parseBoolean(process.env.ORIGIN_PROTECTION_ENABLED, authMode === 'ntlm');
    const csrfProtectionEnabled = parseBoolean(process.env.CSRF_PROTECTION_ENABLED, authMode === 'ntlm');
    const writeRateLimitEnabled = parseBoolean(process.env.WRITE_RATE_LIMIT_ENABLED, authMode === 'ntlm');

    return {
        nodeEnv,
        dbName: process.env.DB_NAME?.trim() ?? '',
        dbUser: process.env.DB_USER?.trim() ?? '',
        dbPassword: process.env.DB_PWD?.trim() ?? '',
        dbServer: process.env.DB_SERVER?.trim() ?? '',
        dbPort: process.env.DB_PORT?.trim() ?? '1433',
        appPort: process.env.PORT?.trim() ?? '8000',
        dbInstance: process.env.DB_INSTANCE?.trim() ?? '',
        authMode,
        authTableName: process.env.AUTH_TABLENAME?.trim() ?? authorizationTableName,
        locale: process.env.LOCALE?.trim().toLocaleLowerCase() ?? 'en',
        allowedOrigins,
        originProtectionEnabled,
        csrfProtectionEnabled,
        csrfSecret: process.env.CSRF_SECRET?.trim() ?? '',
        writeRateLimitEnabled,
        writeRateLimitWindowMs: parseInteger(process.env.WRITE_RATE_LIMIT_WINDOW_MS, 60000),
        writeRateLimitMaxRequests: parseInteger(process.env.WRITE_RATE_LIMIT_MAX_REQUESTS, 60),
    };
};
