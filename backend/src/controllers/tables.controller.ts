import { Request, Response } from 'express';
import { listTables } from '../services/table.service.js';

export const retrieveTables = async (req: Request, res: Response) => {
    const tables = await listTables();
    res.json(tables);
};
