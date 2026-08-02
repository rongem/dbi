import { getLocale } from '../utils/locales.function.js';
import { readRuntimeConfig } from './runtime-config.js';
import type { RuntimeConfig } from './runtime-config.js';

export const validateRuntimeConfig = (config: RuntimeConfig = readRuntimeConfig()) => {
    if (!config.dbName) {
        throw new Error(getLocale().environmentDbNameMissingError);
    }
    if (!config.dbUser) {
        throw new Error(getLocale().environmentDbUserMissingError);
    }
    if (!config.dbPassword) {
        throw new Error(getLocale().environmentDbPasswordMissingError);
    }
    if (!config.dbServer) {
        throw new Error(getLocale().environmentDbServerMissingError);
    }
    if (!['ntlm', 'none'].includes(config.authMode)) {
        throw new Error(getLocale().environmentAuthModeError + config.authMode);
    }
    if (config.nodeEnv === 'production' && config.authMode === 'none') {
        throw new Error(getLocale(config.locale).environmentAuthModeNoneInProductionError);
    }
    if (isNaN(+config.dbPort)) {
        throw new Error(getLocale().environmentDbPortError);
    }
    if (isNaN(+config.appPort)) {
        throw new Error('Non numeric value in variable PORT.');
    }
    if (config.nodeEnv === 'production' && config.originProtectionEnabled && config.allowedOrigins.length === 0) {
        throw new Error(getLocale(config.locale).environmentAllowedOriginsMissingError);
    }
    if (config.nodeEnv === 'production' && config.csrfProtectionEnabled && !config.csrfSecret) {
        throw new Error(getLocale(config.locale).environmentCsrfSecretMissingError);
    }
    if (!Number.isInteger(config.writeRateLimitWindowMs) || config.writeRateLimitWindowMs <= 0) {
        throw new Error(getLocale(config.locale).environmentWriteRateLimitWindowError);
    }
    if (!Number.isInteger(config.writeRateLimitMaxRequests) || config.writeRateLimitMaxRequests <= 0) {
        throw new Error(getLocale(config.locale).environmentWriteRateLimitMaxRequestsError);
    }
};