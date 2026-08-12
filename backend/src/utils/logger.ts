type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogDetails = Record<string, unknown> | string | number | boolean | null | undefined;

const SENSITIVE_KEYS = ['password', 'secret', 'token'];

/**
 * Redacts sensitive keys from a log payload so credentials and tokens are never written to plain-text output.
 */
const maskSensitiveData = (details: LogDetails): LogDetails => {
    if (typeof details !== 'object' || details === null) return details;
    const masked: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(details as Record<string, unknown>)) {
        masked[key] = SENSITIVE_KEYS.some(sk => key.toLowerCase().includes(sk)) ? '***' : value;
    }
    return masked as LogDetails;
};

/**
 * Writes a structured log entry with a timestamp, level, and sanitized details while sending errors to stderr and warnings/info to stdout.
 */
const write = (level: LogLevel, message: string, details?: LogDetails) => {
    const entry: Record<string, unknown> = {
        level,
        message,
        timestamp: new Date().toISOString(),
    };
    if (details !== undefined) {
        entry.details = maskSensitiveData(details);
    }
    const text = JSON.stringify(entry);
    if (level === 'error') {
        console.error(text);
        return;
    }
    if (level === 'warn') {
        console.warn(text);
        return;
    }
    console.log(text);
};

export const logger = {
    debug(message: string, details?: LogDetails) {
        write('debug', message, details);
    },
    info(message: string, details?: LogDetails) {
        write('info', message, details);
    },
    warn(message: string, details?: LogDetails) {
        write('warn', message, details);
    },
    error(message: string, details?: LogDetails) {
        write('error', message, details);
    },
};