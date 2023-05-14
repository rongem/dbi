export {};

declare global {
    namespace Express {
        interface Request {
            userName: string;
            userAuthorized: boolean;
        }
    }
}