export type ErrorCode =
    | 'VALIDATION_ERROR'
    | 'AUTHENTICATION_ERROR'
    | 'AUTHORIZATION_ERROR'
    | 'NOT_FOUND'
    | 'TOO_MANY_REQUESTS'
    | 'INTERNAL_ERROR';

export const errorCodeFromStatus = (status: number): ErrorCode => {
    if (status === 400) return 'VALIDATION_ERROR';
    if (status === 401) return 'AUTHENTICATION_ERROR';
    if (status === 403) return 'AUTHORIZATION_ERROR';
    if (status === 404) return 'NOT_FOUND';
    if (status === 429) return 'TOO_MANY_REQUESTS';
    return 'INTERNAL_ERROR';
};
