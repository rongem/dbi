import * as mssql from 'mssql';

import { requestPromise } from '../db';
import { User } from '../data/user.model';
import { HttpError } from '../rest-api/httpError.model';
import { EnvironmentController } from '../../controllers/environment.controller';
import { getLocale } from '../../utils/locales.function';

const env = EnvironmentController.instance;

export const readUser = async (name: string): Promise<User> => {
    try {
        const req = await requestPromise();
        req.input('name', mssql.NVarChar(50), name);
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
        console.log('readUser', error);
        throw new HttpError(500, error.message ?? error.toString(), {name});
    }
};

const getDatabaseKey = (object: any, key: string) => Object.keys(object).find(k => k.toLocaleLowerCase() === key.toLocaleLowerCase());

const createUser = async (name: string): Promise<User> => {
    try {
        const req = await requestPromise();
        req.input('name', mssql.NVarChar(70), name);
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
        console.log('createUser', error);
        throw new HttpError(500, error.message ?? error.toString(), {name});
    }
};

const checkIfTableContainsRequiredColumnsCaseInsensitiveAndReturnKeyNames = (recordset: mssql.IRecordSet<any>) => {
    const userKey = getDatabaseKey(recordset, 'username');
    const allowedKey = getDatabaseKey(recordset, 'allowed');
    if (!userKey || !allowedKey)
        throw new Error(getLocale().illegalColumnsInRequestError);
    return { userKey, allowedKey };
}
