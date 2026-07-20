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

type AuthServiceDependencies = {
    readConfig?: typeof readRuntimeConfig;
    readUserFn?: typeof readUser;
};

const getDependencies = (dependencies?: AuthServiceDependencies) => ({
    readConfig: dependencies?.readConfig ?? readRuntimeConfig,
    readUserFn: dependencies?.readUserFn ?? readUser,
});

export const resolveAuthenticatedUser = async (ntlm?: NtlmIdentity, dependencies?: AuthServiceDependencies): Promise<User> => {
    const { readConfig, readUserFn } = getDependencies(dependencies);
    const env = readConfig();
    if (env.authMode === 'none') {
        return {name: 'none', isAuthorized: true, databaseName: env.dbName};
    }
    if (!ntlm?.UserName) {
        throw new HttpError(401, getLocale(env.locale).missingAuthenticationError);
    }
    const domain = !ntlm.DomainName || ntlm.DomainName === '.' ? ntlm.Workstation : ntlm.DomainName;
    const userName = `${domain}\\${ntlm.UserName}`;
    try {
        return await readUserFn(userName);
    } catch (error: unknown) {
        if (error instanceof Error && error.message === getLocale(env.locale).illegalAuthenticationError) {
            return {name: '', isAuthorized: false, databaseName: env.dbName};
        }
        throw error;
    }
};

export const getUserAuthorization = async (name: string, dependencies?: AuthServiceDependencies): Promise<User> => {
    const { readUserFn } = getDependencies(dependencies);
    return readUserFn(name);
};