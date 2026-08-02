import { HttpError } from '../models/rest-api/httpError.model.js';
import { getLocale } from '../utils/locales.function.js';

const normalizeIdentifier = (value: string) => value.trim().toLocaleLowerCase();

export const ensureProtectedTableIsNotTargeted = (data: {
    schemaName: string;
    tableName: string;
    protectedTableName: string;
    localeName?: string;
}) => {
    const normalizedProtectedTableName = normalizeIdentifier(data.protectedTableName);
    const normalizedTableName = normalizeIdentifier(data.tableName);
    const normalizedSchemaTableName = normalizeIdentifier(`${data.schemaName}.${data.tableName}`);
    const normalizedProtectedTableNameWithoutSchema = normalizedProtectedTableName.includes('.')
        ? normalizedProtectedTableName.split('.').at(-1)!
        : normalizedProtectedTableName;

    if (normalizedTableName === normalizedProtectedTableNameWithoutSchema || normalizedSchemaTableName === normalizedProtectedTableName) {
        throw new HttpError(403, getLocale(data.localeName).protectedTableAccessError(data.protectedTableName), {
            schemaName: data.schemaName,
            tableName: data.tableName,
        });
    }
};
