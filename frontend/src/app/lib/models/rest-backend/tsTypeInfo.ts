import { SqlType } from "./sqltype";

export interface tsTypeInfo {
    sqlType: SqlType;
    allowedTypes: Array<'boolean' | 'date' | 'number' | 'string' | 'binary'>;
}
