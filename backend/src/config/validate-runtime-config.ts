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
    if (isNaN(+config.dbPort)) {
        throw new Error(getLocale().environmentDbPortError);
    }
};