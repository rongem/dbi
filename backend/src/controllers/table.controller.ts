import { Request, Response, NextFunction } from 'express';
import type { Row } from '../models/data/row.model.js';
import type { TableImportRequestDto } from '../models/dto/table-import.dto.js';
import { commitTableImport, previewTableImport } from '../services/table-import.service.js';
import { getTableColumns } from '../services/table.service.js';
import { schemaDescriptor, tableDescriptor } from '../utils/params.descriptors.js';

export const retrieveAndSendTableColumns = async (req: Request, res: Response) => {
    const columns = await getTableColumns(req.params[schemaDescriptor] as string, req.params[tableDescriptor] as string);
    res.json(columns);
};

export const previewTableRows = async (req: Request, res: Response) => {
    return handleImportTableRows(req, res, previewTableImport);
}

export const commitTableRows = async (req: Request, res: Response) => {
    return handleImportTableRows(req, res, commitTableImport);
}

const handleImportTableRows = async (
    req: Request,
    res: Response,
    importTableRows: (data: TableImportRequestDto) => Promise<{rowsInserted: number}>,
) => {
    const schemaName = req.params[schemaDescriptor] as string;
    const tableName = req.params[tableDescriptor] as string;
    const result = await importTableRows({
        schemaName,
        tableName,
        rows: req.body.rows,
    });
    res.json(result);
}

