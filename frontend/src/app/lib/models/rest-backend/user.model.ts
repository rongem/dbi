export interface User {
    name: string;
    isAuthorized: boolean;
    databaseName: string;
    csrfToken?: string;
}
