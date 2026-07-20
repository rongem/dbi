import { getLocale } from '../utils/locales.function.js';
import type { RuntimeConfig } from '../config/runtime-config.js';

export const checkRequiredVariables = (env: RuntimeConfig) => {
    if (!env.dbName) {
        throw new Error(getLocale().environmentDbNameMissingError);
    }
    if (!env.dbUser) {
        throw new Error(getLocale().environmentDbUserMissingError);
    }
    if (!env.dbPassword) {
        throw new Error(getLocale().environmentDbPasswordMissingError);
    }
    if (!env.dbServer) {
        throw new Error(getLocale().environmentDbServerMissingError);
    }
    if (!['ntlm', 'none'].includes(env.authMode)) {
        throw new Error(getLocale().environmentAuthModeError + env.authMode);
    }
    if (isNaN(+env.dbPort)) {
        throw new Error(getLocale().environmentDbPortError);
    }
}

