import type { User } from '../models/data/user.model.js';
import { readRuntimeConfig } from '../config/runtime-config.js';
import { readUser } from '../models/mssql/authorization.model.js';
import { HttpError } from '../models/rest-api/httpError.model.js';
import { getLocale } from '../utils/locales.function.js';

export type NtlmIdentity = {
    DomainName?: string;
    Workstation?: string;
    UserName?: string;
};

export const resolveAuthenticatedUser = async (ntlm?: NtlmIdentity): Promise<User> => {
    const env = readRuntimeConfig();
    if (env.authMode === 'none') {
        return {name: 'none', isAuthorized: true, databaseName: env.dbName};
    }
    if (!ntlm?.UserName) {
        throw new HttpError(401, getLocale(env.locale).missingAuthenticationError);
    }
    const domain = !ntlm.DomainName || ntlm.DomainName === '.' ? ntlm.Workstation : ntlm.DomainName;
    const userName = `${domain}\\${ntlm.UserName}`;
    try {
        return await readUser(userName);
    } catch (error: unknown) {
        if (error instanceof Error && error.message === getLocale(env.locale).illegalAuthenticationError) {
            return {name: '', isAuthorized: false, databaseName: env.dbName};
        }
        throw error;
    }
};

export const getUserAuthorization = async (name: string): Promise<User> => {
    return readUser(name);
};