import { readRuntimeConfig } from '../config/runtime-config.js';
import { checkRequiredVariables } from "./environment.function.js";

export class EnvironmentController {
    private constructor() { 
        checkRequiredVariables(readRuntimeConfig());
    }

    private static _instance: EnvironmentController | null = null;
    static get instance() {
        if (!this._instance) {
            this._instance = new EnvironmentController();
        }
        return this._instance;
    }

    get dbName() {
        return readRuntimeConfig().dbName;
    }

    get dbUser() {
        return readRuntimeConfig().dbUser;
    }

    get dbPassword() {
        return readRuntimeConfig().dbPassword;
    }

    get dbServer() {
        return readRuntimeConfig().dbServer;
    }

    get dbPort() {
        return readRuntimeConfig().dbPort;
    } 

    get dbInstance() {
        return readRuntimeConfig().dbInstance;
    }

    get authMode() {
        return readRuntimeConfig().authMode;
    }

    get authTableName() {
        return readRuntimeConfig().authTableName;
    }

    get locale() {
        return readRuntimeConfig().locale;
    }
}