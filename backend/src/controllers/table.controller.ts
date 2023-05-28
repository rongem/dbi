import { Request, Response, NextFunction } from 'express';
import { selectTables } from '../models/mssql/tables.model';
import { HttpError } from '../models/rest-api/httpError.model';
import { selectColumns } from '../models/mssql/columns.model';
import { Row } from '../models/data/row.model';
import { insertRows } from '../models/mssql/rows.model';

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

export const retrieveAndSendTableColumns = async (req: Request, res: Response, next: NextFunction) => {
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

export const saveTableRows = async (req: Request, res: Response, next: NextFunction) => {
    return importTableRows(req, res, true);
}

export const testTableRows = async (req: Request, res: Response, next: NextFunction) => {
    return importTableRows(req, res, false);
}

const importTableRows = async (req: Request, res: Response, commit: boolean) => {
    try {
        const data = await extractParams(req, commit);
        const result = await insertRows(data);
        return res.json({errors: 0});
    } catch (error: any) {
        if (error instanceof HttpError) {
            throw error;
        }
        console.log('saveTableRows', error);
        throw new HttpError(500, error.message ?? error.toString());
    }
}

 const extractParams = async(req: Request, commit: boolean) => {
    const schemaName = req.params['schemaName'];
    const tableName = req.params['tableName'];
    const columns = await selectColumns(schemaName, tableName);
    const rows = req.body as Row[];
    return { schemaName, tableName, rows, columns, commit };
}

