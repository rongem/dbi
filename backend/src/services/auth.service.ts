import type { User } from '../models/data/user.model.js';
import { HttpError } from '../models/rest-api/httpError.model.js';
import { getLocale } from '../utils/locales.function.js';
import { defaultAuthRepository, type AuthRepository } from '../repositories/auth.repository.js';
import { getReadConfig, getRepository, type ReadConfigDependency, type RepositoryDependency } from './service-ports.js';

export type NtlmIdentity = {
    DomainName?: string;
    Workstation?: string;
    UserName?: string;
};

type AuthServiceDependencies = ReadConfigDependency & RepositoryDependency<AuthRepository>;

export const resolveAuthenticatedUser = async (ntlm?: NtlmIdentity, dependencies?: AuthServiceDependencies): Promise<User> => {
    const readConfig = getReadConfig(dependencies);
    const repository = getRepository(dependencies, defaultAuthRepository);
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
    const repository = getRepository(dependencies, defaultAuthRepository);
    return repository.readUser(name);
};