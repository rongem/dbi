type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogDetails = Record<string, unknown> | string | number | boolean | null | undefined;

const write = (level: LogLevel, message: string, details?: LogDetails) => {
    const entry: Record<string, unknown> = {
        level,
        message,
        timestamp: new Date().toISOString(),
    };
    if (details !== undefined) {
        entry.details = details;
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