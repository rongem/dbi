import { Request, Response, NextFunction } from 'express';
import { selectTables } from '../models/mssql/tables.model.js';
import { HttpError } from '../models/rest-api/httpError.model.js';
import { selectColumns } from '../models/mssql/columns.model.js';
import { Row } from '../models/data/row.model.js';
import { insertRows } from '../models/mssql/rows.model.js';
import { schemaDescriptor, tableDescriptor } from '../utils/params.descriptors.js';

export const retrieveTableNames = async () => {
    try {
        const tables = await selectTables();
        return tables;
    } catch (error: any) {
        if (error && typeof error === 'object' && 'httpStatusCode' in error) {
            throw error;
        }
        throw new HttpError(500, error.message ?? error.toString());
    }
}

export const retrieveAndSendTableColumns = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const columns = await selectColumns(req.params[schemaDescriptor] as string, req.params[tableDescriptor] as string);
        res.json(columns);
    } catch (error: any) {
        if (error && typeof error === 'object' && 'httpStatusCode' in error) {
            throw error;
        }
        next(new HttpError(500, error.message ?? error.toString()));
    }
};

export const saveTableRows = async (req: Request, res: Response, next: NextFunction) => {
    return importTableRows(req, res, next, true);
}

export const testTableRows = async (req: Request, res: Response, next: NextFunction) => {
    return importTableRows(req, res, next, false);
}

const importTableRows = async (req: Request, res: Response, next: NextFunction, commit: boolean) => {
    try {
        const data = await extractParams(req, commit);
        const rowsInserted = await insertRows(data);
        res.json({rowsInserted});
    } catch (error: any) {
        if (error && typeof error === 'object' && 'httpStatusCode' in error) {
            next(error);
        } else {
            next(new HttpError(400, error.message ?? error.toString()));
        }
    }
}

const extractParams = async(req: Request, commit: boolean) => {
    const schemaName = req.params[schemaDescriptor] as string;
    const tableName = req.params[tableDescriptor] as string;
    const columns = await selectColumns(schemaName as string, tableName as string);
    const rows = req.body.rows as Row[];
    return { schemaName, tableName, rows, columns, commit };
}

