import { Request, Response } from 'express';
import { checkDatabase } from '../models/db.js';

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