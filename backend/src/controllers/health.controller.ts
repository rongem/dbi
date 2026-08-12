import { Request, Response } from 'express';
import { checkDatabase } from '../models/db.js';

/**
 * Returns a lightweight health payload used by monitoring endpoints and internal readiness checks.
 */
export const getHealth = (req: Request, res: Response) => {
    res.json({
        success: true,
        data: {
            status: 'ok',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
        },
    });
};

/**
 * Verifies that the application can reach the configured database and reports a 503 status when the backing store is not ready yet.
 */
export const getReadiness = async (req: Request, res: Response) => {
    const databaseReady = await checkDatabase();
    if (!databaseReady) {
        return res.status(503).json({
            success: true,
            data: {
                status: 'not-ready',
                checks: {
                    database: false,
                },
                timestamp: new Date().toISOString(),
            },
        });
    }

    return res.json({
        success: true,
        data: {
            status: 'ready',
            checks: {
                database: true,
            },
            timestamp: new Date().toISOString(),
        },
    });
};