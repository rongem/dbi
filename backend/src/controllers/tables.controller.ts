import { Request, Response, NextFunction } from 'express';
import { selectTables } from '../models/mssql/tables.model';

export const retrieveTables = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log('was here');
        const tables = await selectTables();
        return res.json(tables);
    } catch (error) {
        console.log('error');
        res.json({error});
    }
};