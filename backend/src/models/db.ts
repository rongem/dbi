// import { config, ConnectionPool, Request, Transaction } from 'mssql';
import sql from 'mssql';
import type { config } from 'mssql'; // Typen-Imports sind für Node zur Laufzeit unsichtbar

const { ConnectionPool, Request, Transaction } = sql;
import { EnvironmentController } from '../controllers/environment.controller.js';
import { sqlGetAllTableNamesCurrentUserHasRights } from '../utils/sql.templates.js';
import { getLocale } from '../utils/locales.function.js';

const env = EnvironmentController.instance;

const sqlConfig: config = {
    user: env.dbUser,
    password: env.dbPassword,
    database: env.dbName,
    server: env.dbServer,
    port: +env.dbPort,
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    options: {
        instanceName: env.dbInstance,
        encrypt: false, // for azure
        trustServerCertificate: true // change to true for local dev / self-signed certs
    }
}

// const poolPromise = new ConnectionPool(sqlConfig);
let poolPromise: Promise<sql.ConnectionPool> | null = null;


let connectedPool: sql.ConnectionPool;

export const pool = async () => {
    if (connectedPool) return connectedPool;
    if (!poolPromise) {
        poolPromise = new ConnectionPool(sqlConfig).connect();
    }
    const p = await poolPromise
        .then(pool => {
            if (env.authMode !== 'none') console.debug(getLocale().connectedToMessage, sqlConfig.server, sqlConfig.options?.instanceName, sqlConfig.database);
            return pool;
        }).catch(err => {
            console.error(getLocale().databaseConnectionError, err)
            throw new Error(err);
        });
    return connectedPool = p;
}

export const requestPromise = async () => {
    const connection = await pool();
    return new Request(connection);
};

export const transactionPool = async () => {
    const connection = await pool();
    const transaction = new Transaction(connection);
    return transaction.begin();
}

export const transactionRequest = async (transaction: sql.Transaction) => {
    return new Request(transaction)
}

// preflight check if connection works and all tables and stored procedures exist
export const checkDatabase = async () => {
    const req = await requestPromise();
    try {
        let result = (await req.query(sqlGetAllTableNamesCurrentUserHasRights)).recordset.map(r => [
            (r.TABLE_NAME as string).toLocaleLowerCase(),
            (r.TABLE_SCHEMA as string + '.' + r.TABLE_NAME as string).toLocaleLowerCase(),
        ]).flat();
        if (!result.includes(env.authTableName.toLocaleLowerCase())) {
            throw new Error(getLocale().missingTableError(env.authTableName));
        }
    } catch (error: any) {
        console.log(error);
        return false;
    }
    return true;
}
