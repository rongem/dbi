import type { User } from '../models/data/user.model.js';
import { readRuntimeConfig } from '../config/runtime-config.js';
import { HttpError } from '../models/rest-api/httpError.model.js';
import { getLocale } from '../utils/locales.function.js';
import { defaultAuthRepository, type AuthRepository } from '../repositories/auth.repository.js';

export type NtlmIdentity = {
    DomainName?: string;
    Workstation?: string;
    UserName?: string;
};

type AuthServiceDependencies = {
    readConfig?: typeof readRuntimeConfig;
    repository?: AuthRepository;
};

const getDependencies = (dependencies?: AuthServiceDependencies) => ({
    readConfig: dependencies?.readConfig ?? readRuntimeConfig,
    repository: dependencies?.repository ?? defaultAuthRepository,
});

export const resolveAuthenticatedUser = async (ntlm?: NtlmIdentity, dependencies?: AuthServiceDependencies): Promise<User> => {
    const { readConfig, repository } = getDependencies(dependencies);
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
        return await repository.readUser(userName);
    } catch (error: unknown) {
        if (error instanceof Error && error.message === getLocale(env.locale).illegalAuthenticationError) {
            return {name: '', isAuthorized: false, databaseName: env.dbName};
        }
        throw error;
    }
};

export const getUserAuthorization = async (name: string, dependencies?: AuthServiceDependencies): Promise<User> => {
    const { repository } = getDependencies(dependencies);
    return repository.readUser(name);
};