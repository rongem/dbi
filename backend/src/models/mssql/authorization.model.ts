import sql from 'mssql';

import { readRuntimeConfig } from '../../config/runtime-config.js';
import { requestPromise } from '../db.js';
import { User } from '../data/user.model.js';
import { HttpError } from '../rest-api/httpError.model.js';
import { getLocale } from '../../utils/locales.function.js';
import { logger } from '../../utils/logger.js';

const { TYPES } = sql;

export const readUser = async (name: string): Promise<User> => {
    try {
        const env = readRuntimeConfig();
        const req = await requestPromise();
        req.input('name', TYPES.NVarChar(50), name);
        const result = await req.query(`SELECT * FROM ${env.authTableName} WHERE [Username]=@name`);
        if (result.rowsAffected.length === 1 && result.rowsAffected[0] === 0) {
            createUser(name);
            return {name, isAuthorized: false, databaseName: env.dbName};
        }
        const { userKey, allowedKey } = checkIfTableContainsRequiredColumnsCaseInsensitiveAndReturnKeyNames(result.recordset[0]);
        const user: User = {
            name: (result.recordset[0][userKey] as string).trim(),
            isAuthorized: result.recordset[0][allowedKey],
            databaseName: env.dbName,
        };
        return user;
    } catch (error: any) {
        logger.error('read_user_failed', {name, error: error instanceof Error ? error.message : String(error)});
        throw new HttpError(500, error.message ?? error.toString(), {name});
    }
};

const getDatabaseKey = (object: any, key: string) => Object.keys(object).find(k => k.toLocaleLowerCase() === key.toLocaleLowerCase());

const createUser = async (name: string): Promise<User> => {
    try {
        const env = readRuntimeConfig();
        const req = await requestPromise();
        req.input('name', TYPES.NVarChar(70), name);
        const result = await req.query(`INSERT INTO ${env.authTableName} ([Username], [Allowed]) VALUES (@name, 0)`);
        if (result.rowsAffected.length !== 1 || result.rowsAffected[0] !== 1) {
            throw new Error('INSERT Authorizations: Data could not be stored.');
        }
        return {
            name: '',
            isAuthorized: false,
            databaseName: env.dbName,
        }
    } catch (error: any) {
        logger.error('create_user_failed', {name, error: error instanceof Error ? error.message : String(error)});
        throw new HttpError(500, error.message ?? error.toString(), {name});
    }
};

const checkIfTableContainsRequiredColumnsCaseInsensitiveAndReturnKeyNames = (recordset: sql.IRecordSet<any>) => {
    const env = readRuntimeConfig();
    const userKey = getDatabaseKey(recordset, 'username');
    const allowedKey = getDatabaseKey(recordset, 'allowed');
    if (!userKey || !allowedKey)
        throw new Error(getLocale(env.locale).illegalColumnsInRequestError);
    return { userKey, allowedKey };
}
