import { HttpError } from '../models/rest-api/httpError.model.js';

export type ImportResultStatus = 'success' | 'failed_validation' | 'failed_internal';

export const classifyImportResultStatus = (error: unknown): ImportResultStatus => {
    if (error instanceof HttpError && error.httpStatusCode < 500) {
        return 'failed_validation';
    }
    return 'failed_internal';
};
