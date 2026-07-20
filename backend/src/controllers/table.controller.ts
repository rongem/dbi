import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../models/rest-api/httpError.model.js';
import type { Row } from '../models/data/row.model.js';
import { commitTableImport, previewTableImport } from '../services/table-import.service.js';
import { getTableColumns } from '../services/table.service.js';
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

export const previewTableRows = async (req: Request, res: Response, next: NextFunction) => {
    return handleImportTableRows(req, res, next, previewTableImport);
}

export const commitTableRows = async (req: Request, res: Response, next: NextFunction) => {
    return handleImportTableRows(req, res, next, commitTableImport);
}

const handleImportTableRows = async (
    req: Request,
    res: Response,
    next: NextFunction,
    importTableRows: (data: {schemaName: string; tableName: string; rows: Row[]}) => Promise<number>,
) => {
    try {
        const schemaName = req.params[schemaDescriptor] as string;
        const tableName = req.params[tableDescriptor] as string;
        const rowsInserted = await importTableRows({
            schemaName,
            tableName,
            rows: req.body.rows,
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

