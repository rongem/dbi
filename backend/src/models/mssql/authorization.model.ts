import * as mssql from 'mssql';

import { pool } from '../db';
import { User } from '../data/user.model';
import { HttpError } from '../rest-api/httpError.model';
import { EnvironmentController } from '../../controllers/environment.controller';

const env = EnvironmentController.instance;

export const readUser = async (name: string): Promise<User> => {
    try {
        const req = await pool().then(connection => new mssql.Request(connection));
        req.input('name', mssql.NVarChar(70), name);
        const result = await req.query(`SELECT * FROM ${env.authTableName} WHERE [Username]=@name`);
        if (result.rowsAffected.length === 1 && result.rowsAffected[0] === 0) {
            createUser(name);
            return {name, isAuthorized: false, databaseName: env.dbName};
        }
        const user: User = { name: result.recordset[0].Username, isAuthorized: result.recordset[0].Allowed, databaseName: env.dbName };
        return user;
    } catch (error: any) {
        console.log('readUser', error);
        throw new HttpError(500, error.message ?? error.toString(), name);
    }
};

const createUser = async (name: string): Promise<User> => {
    try {
        const req = await pool().then(connection => new mssql.Request(connection));
        req.input('name', mssql.NVarChar(70), name);
        const result = await req.query(`INSERT INTO ${env.authTableName} ([Username], [Allowed]) VALUES (@name, 0)`);
        if (result.rowsAffected.length !== 1 || result.rowsAffected[0] !== 1) {
            throw new Error('INSERT Authorizations: Daten wurden nicht geschrieben.');
        }
        return {
            name: '',
            isAuthorized: false,
            databaseName: env.dbName,
        }
    } catch (error: any) {
        console.log('createUser', error);
        throw new HttpError(500, error.message ?? error.toString(), name);
    }
};