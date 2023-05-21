import { config, ConnectionPool, Request } from 'mssql';
import { EnvironmentController } from '../controllers/environment.controller';
import { sqlGetAllTableNamesCurrentUserHasRights } from '../utils/sql.templates';

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

const poolPromise = new ConnectionPool(sqlConfig);

let connectedPool: ConnectionPool;

export const pool = async () => {
    if (connectedPool) return connectedPool;
    const p = await poolPromise.connect()
        .then(pool => {
            console.debug('Connected to', sqlConfig.server, sqlConfig.options?.instanceName, sqlConfig.database);
            return pool;
        }).catch(err => {
            console.error('Database Connection Failed! Bad Config: ', err)
            throw new Error(err);
        });
    return connectedPool = p;
}

export const requestPromise = async () => {
    const connection = await pool();
    return new Request(connection);
};

// preflight check if connection works and all tables and stored procedures exist
export const checkDatabase = async () => {
    const req = await requestPromise();
    try {
        let result = (await req.query(sqlGetAllTableNamesCurrentUserHasRights)).recordset.map(r => r.TABLE_NAME as string);
        if (!result.includes(env.authTableName)) {
            throw new Error('Missing table ' + env.authTableName);
        }
    } catch (error: any) {
        console.log(error);
        return false;
    }
    return true;
}
