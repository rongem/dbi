// import { config, ConnectionPool, Request, Transaction } from 'mssql';
import sql from 'mssql';
import type { config } from 'mssql'; // Typen-Imports sind für Node zur Laufzeit unsichtbar

const { ConnectionPool, Request, Transaction } = sql;
import { readRuntimeConfig } from '../config/runtime-config.js';
import { sqlGetAllTableNamesCurrentUserHasRights } from '../utils/sql.templates.js';
import { getLocale } from '../utils/locales.function.js';
import { logger } from '../utils/logger.js';

export const createSqlConfig = (): config => {
    const env = readRuntimeConfig();
    return {
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
        // increase default request timeout from 15s to 60s for tests
        requestTimeout: 60000,
        options: {
            instanceName: env.dbInstance,
            encrypt: false, // for azure
            trustServerCertificate: true // change to true for local dev / self-signed certs
        }
    };
};

// const poolPromise = new ConnectionPool(sqlConfig);
let poolPromise: Promise<sql.ConnectionPool> | null = null;

let connectedPool: sql.ConnectionPool | null = null;

/**
 * Returns a shared SQL Server connection pool and lazily creates it on first use.
 * The pool is cached to avoid reconnecting on every request while still handling startup failures consistently.
 */
export const pool = async () => {
    if (connectedPool) return connectedPool;
    if (!poolPromise) {
        const sqlConfig = createSqlConfig();
        poolPromise = new ConnectionPool(sqlConfig).connect();
    }
    const p = await poolPromise
        .then(pool => {
            const env = readRuntimeConfig();
            const sqlConfig = createSqlConfig();
            if (env.authMode !== 'none') logger.info('database_connected', {server: sqlConfig.server, instanceName: sqlConfig.options?.instanceName, database: sqlConfig.database});
            return pool;
        }).catch(err => {
            logger.error('database_connection_failed', {message: getLocale().databaseConnectionError, error: err instanceof Error ? err.message : String(err)});
            throw new Error(err);
        });
    return connectedPool = p;
}

/**
 * Closes the database pool and clears the cached connection so tests and shutdown routines can reset the SQL state reliably.
 */
export const closePool = async () => {
    try {
        if (connectedPool) {
            await connectedPool.close();
            return;
        }
        if (poolPromise) {
            const pendingPool = await poolPromise;
            await pendingPool.close();
        }
    } finally {
        connectedPool = null;
        poolPromise = null;
    }
};

/**
 * Creates a new SQL request bound to the active connection pool and is used by database queries that do not need a transaction.
 */
export const requestPromise = async () => {
    const connection = await pool();
    return new Request(connection);
};

/**
 * Starts a database transaction over the shared pool so import operations can commit or roll back as one atomic unit.
 */
export const transactionPool = async () => {
    const connection = await pool();
    const transaction = new Transaction(connection);
    return transaction.begin();
}

export const transactionRequest = async (transaction: sql.Transaction, overrides?: { requestTimeout?: number }) => {
    return new (Request as any)(transaction, overrides);
}

// preflight check if connection works and all tables and stored procedures exist
/**
 * Performs a lightweight database readiness check and confirms that the authorization table exists and is accessible to the configured user.
 */
export const checkDatabase = async () => {
    const req = await requestPromise();
    try {
        const env = readRuntimeConfig();
        let result = (await req.query(sqlGetAllTableNamesCurrentUserHasRights)).recordset.map(r => [
            (r.TABLE_NAME as string).toLocaleLowerCase(),
            (r.TABLE_SCHEMA as string + '.' + r.TABLE_NAME as string).toLocaleLowerCase(),
        ]).flat();
        if (!result.includes(env.authTableName.toLocaleLowerCase())) {
            throw new Error(getLocale().missingTableError(env.authTableName));
        }
    } catch (error: any) {
        logger.warn('database_check_failed', {error: error instanceof Error ? error.message : String(error)});
        return false;
    }
    return true;
}
