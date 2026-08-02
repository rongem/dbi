// import { checkDatabase } from './models/db';
import type { Server } from 'node:http';

import { app } from './app.js';
import { readRuntimeConfig } from './config/runtime-config.js';
import { validateRuntimeConfig } from './config/validate-runtime-config.js';
import { checkDatabase, closePool } from './models/db.js';
import { logger } from './utils/logger.js';

const env = readRuntimeConfig();
validateRuntimeConfig(env);

let server: Server | null = null;
let shuttingDown = false;

const closeServer = async () => {
    if (!server) return;
    await new Promise<void>((resolve) => {
        server!.close(() => resolve());
    });
    server = null;
};

const shutdown = async (signal: 'SIGINT' | 'SIGTERM') => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info('shutdown_requested', { signal });

    try {
        await closeServer();
        await closePool();
        logger.info('shutdown_completed', { signal });
        process.exit(0);
    } catch (error: unknown) {
        logger.error('shutdown_failed', {
            signal,
            error: error instanceof Error ? error.message : String(error),
        });
        process.exit(1);
    }
};

process.on('SIGINT', () => {
    void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
});

checkDatabase().then((result) => {
    if (result === true) {
        server = app.listen(+env.appPort);
        logger.info('server_started', { port: +env.appPort });
    }
});
