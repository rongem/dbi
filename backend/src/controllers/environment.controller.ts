import { authorizationTableName } from "../utils/config.templates";

export class EnvironmentController {
    private constructor() {
        if (!this.dbName) {
            throw new Error('Environment variable DB_NAME not configured.');
        }
        if (!this.dbUser) {
            throw new Error('Environment variable DB_USER not configured.');
        }
        if (!this.dbPassword) {
            throw new Error('Environment variable DB_PWD not configured.');
        }
        if (!this.dbServer) {
            throw new Error('Environment variable DB_SERVER not configured.');
        }
        if (!['ntlm', 'none'].includes(this.authMode)) {
            throw new Error('Illegal authentication mode in variable AUTH_MODE: ' + this.authMode);
        }
        if (isNaN(+this.dbPort)) {
            throw new Error('Non numeric value in variable DB_PORT.');
        }
    }

    private static _instance = new EnvironmentController();
    static get instance() {
        return this._instance;
    }

    get dbName() {
        return process.env.DB_NAME?.trim() ?? '';
    }

    get dbUser() {
        return process.env.DB_USER?.trim() ?? '';
    }

    get dbPassword() {
        return process.env.DB_PWD?.trim() ?? '';
    }

    get dbServer() {
        return process.env.DB_SERVER?.trim() ?? '';
    }

    get dbPort() {
        return process.env.DB_PORT?.trim() ?? '1433';
    } 

    get dbInstance() {
        return process.env.DB_INSTANCE?.trim() ?? '';
    }

    get authMode() {
        return process.env.AUTH_MODE?.trim().toLocaleLowerCase() ?? 'ntlm';
    }

    get authTableName() {
        return process.env.AUTH_TABLENAME?.trim() ?? authorizationTableName;
    }

    get locale() {
        return process.env.LOCALE?.trim() ?? 'en';
    }
}