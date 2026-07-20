import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../models/rest-api/httpError.model.js';
import { listTables } from '../services/table.service.js';

export const retrieveTables = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tables = await listTables();
        res.json(tables);
    } catch (error: any) {
        if (error instanceof HttpError) {
            throw error;
        }
        console.log('retrievTables', error);
        throw new HttpError(500, error.message ?? error.toString());
    }
};
