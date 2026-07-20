import type { User } from '../models/data/user.model.js';
import { readUser } from '../models/mssql/authorization.model.js';

export type AuthRepository = {
    readUser: (name: string) => Promise<User>;
};

export const defaultAuthRepository: AuthRepository = {
    readUser: async (name: string) => readUser(name),
};