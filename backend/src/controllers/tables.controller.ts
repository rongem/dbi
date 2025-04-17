import { Request, Response, NextFunction } from 'express';
import { selectTables } from '../models/mssql/tables.model';
import { HttpError } from '../models/rest-api/httpError.model';

export const retrieveTables = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tables = await selectTables();
        res.json(tables);
    } catch (error: any) {
        if (error instanceof HttpError) {
            throw error;
        }
        console.log('retrievTables', error);
        throw new HttpError(500, error.message ?? error.toString());
    }
};
