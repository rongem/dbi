import { ColumnObject } from "../../src/models/data/column-object.model";

export {};

declare global {
    namespace Express {
        interface Request {
            requestId: string;
            userName: string;
            userAuthorized: boolean;
            sqlColumnObject: ColumnObject;
            sqlColumnNames: string[];
        }
    }
}