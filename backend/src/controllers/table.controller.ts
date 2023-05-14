import { Request, Response, NextFunction } from 'express';
import { selectTables } from '../models/mssql/tables.model';
import { HttpError } from '../models/rest-api/httpError.model';
import { selectColumns } from '../models/mssql/columns.model';

export const retrieveTableNames = async () => {
    try {
        const tables = await selectTables();
        return tables;
    } catch (error: any) {
        if (error instanceof HttpError) {
            throw error;
        }
        console.log('retrievTableNames', error);
        throw new HttpError(500, error.message ?? error.toString());
    }
}

export const retrieveTableColumns = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const columns = await selectColumns(req.params['schemaName'], req.params['tableName']);
        return res.json(columns);
    } catch (error: any) {
        if (error instanceof HttpError) {
            throw error;
        }
        console.log('retrievTables', error);
        throw new HttpError(500, error.message ?? error.toString());
    }
};

