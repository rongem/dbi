export class EnvService {
    // default values overwritten bei env.js in root directory
    apiBaseUrl = '/api';
    authUrl = '/auth/login';
    backendBaseUrl = 'http://localhost:8000/rest/';
    headerText = 'Datenbank-Impoter';

    constructor() {}
}