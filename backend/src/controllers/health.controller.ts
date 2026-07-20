import { Request, Response } from 'express';
import { checkDatabase } from '../models/db.js';

export const getHealth = (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
};

export const getReadiness = async (req: Request, res: Response) => {
    const databaseReady = await checkDatabase();
    if (!databaseReady) {
        return res.status(503).json({
            status: 'not-ready',
            checks: {
                database: false,
            },
            timestamp: new Date().toISOString(),
        });
    }

    return res.json({
        status: 'ready',
        checks: {
            database: true,
        },
        timestamp: new Date().toISOString(),
    });
};