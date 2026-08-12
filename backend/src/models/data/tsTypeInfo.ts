import { SqlType } from "./sqltype.js";

export interface tsTypeInfo {
    sqlType: SqlType;
    allowedTypes: Array<'boolean' | 'date' | 'number' | 'string' | 'binary'>;
}

/**
 * Maps a raw SQL Server type to the normalized logical field categories used across validation and the generic metadata contract.
 * This keeps the rest of the application independent from vendor-specific type names while preserving compatibility with legacy metadata.
 */
export const getTypeInformation = (sqlType: SqlType) => {
    let allowedTypes: Array<'boolean' | 'date' | 'number' | 'string' | 'binary'>;
    switch (sqlType) {
        case 'binary':
        case 'image':
        case 'rowversion':
        case 'timestamp':
        case 'varbinary':
            allowedTypes = ['binary'];
            break;
        case 'bigint':
        case 'decimal':
        case 'float':
        case 'int':
        case 'money':
        case 'numeric':
        case 'real':
        case 'smallint':
        case 'smallmoney':
        case 'tinyint':
            allowedTypes = ['number'];
            break;
        case 'bit':
            allowedTypes = ['boolean'];
            break;
        case 'char':
        case 'geography':
        case 'geometry':
        case 'hierarchyid':
        case 'nchar':
        case 'ntext':
        case 'nvarchar':
        case 'sql_variant':
        case 'text':
        case 'varchar':
        case 'xml':
        case 'uniqueidentifier':
            allowedTypes = ['string'];
            break;
        case 'date':
        case 'datetime':
        case 'datetimeoffset':
        case 'smalldatetime':
        case 'time':
            allowedTypes = ['string', 'date'];
            break;
        default:
            allowedTypes = [];
            break;
    }
    const typeInfo: tsTypeInfo = {
        sqlType,
        allowedTypes,
    };
    return typeInfo;
};