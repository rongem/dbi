import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../models/rest-api/httpError.model.js';
import { getTableColumns, importTableRows as importRows } from '../services/table.service.js';
import { schemaDescriptor, tableDescriptor } from '../utils/params.descriptors.js';

export const retrieveAndSendTableColumns = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const columns = await getTableColumns(req.params[schemaDescriptor] as string, req.params[tableDescriptor] as string);
        res.json(columns);
    } catch (error: any) {
        if (error && typeof error === 'object' && 'httpStatusCode' in error) {
            throw error;
        }
        next(new HttpError(500, error.message ?? error.toString()));
    }
};

export const saveTableRows = async (req: Request, res: Response, next: NextFunction) => {
    return handleImportTableRows(req, res, next, true);
}

export const testTableRows = async (req: Request, res: Response, next: NextFunction) => {
    return handleImportTableRows(req, res, next, false);
}

const handleImportTableRows = async (req: Request, res: Response, next: NextFunction, commit: boolean) => {
    try {
        const schemaName = req.params[schemaDescriptor] as string;
        const tableName = req.params[tableDescriptor] as string;
        const rowsInserted = await importRows({
            schemaName,
            tableName,
            rows: req.body.rows,
            commit,
        });
        res.json({rowsInserted});
    } catch (error: any) {
        if (error && typeof error === 'object' && 'httpStatusCode' in error) {
            next(error);
        } else {
            next(new HttpError(400, error.message ?? error.toString()));
        }
    }
}

