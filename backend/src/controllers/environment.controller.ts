import { authorizationTableName } from "../utils/config.templates";
import { checkRequiredVariables } from "./environment.function";

export class EnvironmentController {
    private constructor() {
        checkRequiredVariables(this);
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
        return process.env.LOCALE?.trim().toLocaleLowerCase() ?? 'en';
    }
}