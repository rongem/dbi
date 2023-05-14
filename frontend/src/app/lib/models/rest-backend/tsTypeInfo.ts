import { SqlType } from "./sqltype";

export interface tsTypeInfo {
    sqlType: SqlType;
    allowedTypes: string[];
}
