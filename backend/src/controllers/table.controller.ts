import { Request, Response, NextFunction } from 'express';
import { selectTables } from '../models/mssql/tables.model';
import { HttpError } from '../models/rest-api/httpError.model';
import { selectColumns } from '../models/mssql/columns.model';
import { Row } from '../models/data/row.model';
import { insertRows } from '../models/mssql/rows.model';
import { schemaDescriptor, tableDescriptor } from '../utils/params.descriptors';

export const retrieveTableNames = async () => {
    try {
        const tables = await selectTables();
        return tables;
    } catch (error: any) {
        if (error instanceof HttpError) {
            throw error;
        }
        throw new HttpError(500, error.message ?? error.toString());
    }
}

export const retrieveAndSendTableColumns = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const columns = await selectColumns(req.params[schemaDescriptor], req.params[tableDescriptor]);
        res.json(columns);
    } catch (error: any) {
        if (error instanceof HttpError) {
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
        if (error instanceof HttpError) {
            next(error);
        } else {
            next(new HttpError(400, error.message ?? error.toString()));
        }
    }
}

 const extractParams = async(req: Request, commit: boolean) => {
    const schemaName = req.params[schemaDescriptor];
    const tableName = req.params[tableDescriptor];
    const columns = await selectColumns(schemaName, tableName);
    const rows = req.body.rows as Row[];
    return { schemaName, tableName, rows, columns, commit };
}

