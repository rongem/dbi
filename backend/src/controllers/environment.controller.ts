export class EnvironmentController {
    private constructor() {
        if (!this.dbName) {
            throw new Error('Umgebungsvariable DB_NAME wurde nicht gefunden.');
        }
        if (!this.dbUser) {
            throw new Error('Umgebungsvariable DB_USER wurde nicht gefunden.');
        }
        if (!this.dbPassword) {
            throw new Error('Umgebungsvariable DB_PWD wurde nicht gefunden.');
        }
        if (!this.dbServer) {
            throw new Error('Umgebungsvariable DB_SERVER wurde nicht gefunden.');
        }
        if (!['ntlm', 'none'].includes(this.authMode)) {
            throw new Error('Ungültige Authentifzierungsmethode: ' + this.authMode);
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

    get corsOrigin() {
        return process.env.CORS_ORIGIN?.trim() ?? '*';
    }

    get authMode() {
        return process.env.AUTH_MODE?.trim().toLocaleLowerCase() ?? 'ntlm';
    }

    get ldapDomain() {
        return process.env.LDAP_DOMAIN?.trim() ?? undefined;
    }

    get ldapServer() {
        return process.env.LDAP_SERVER?.trim() ?? undefined;
    }
}