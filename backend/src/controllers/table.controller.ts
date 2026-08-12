import { Request, Response, NextFunction } from 'express';
import type { Row } from '../models/data/row.model.js';
import type { TableImportRequestDto } from '../models/dto/table-import.dto.js';
import { commitTableImport, previewTableImport } from '../services/table-import.service.js';
import { getTableColumns } from '../services/table.service.js';
import { schemaDescriptor, tableDescriptor } from '../utils/params.descriptors.js';
import { logger } from '../utils/logger.js';
import { HttpError } from '../models/rest-api/httpError.model.js';
import { classifyImportResultStatus } from '../utils/import-audit.js';

/**
 * Loads the column metadata for a selected schema and table and returns it in the API response so the frontend can render validation hints and import controls.
 */
export const retrieveAndSendTableColumns = async (req: Request, res: Response) => {
    const columns = await getTableColumns(req.params[schemaDescriptor] as string, req.params[tableDescriptor] as string);
    res.json({
        success: true,
        data: columns,
    });
};

/**
 * Validates a row set in dry-run mode and returns import status information without committing database changes.
 */
export const previewTableRows = async (req: Request, res: Response) => {
    return handleImportTableRows(req, res, previewTableImport, 'preview');
}

/**
 * Commits the validated row set to the target table after all backend checks and import validation have succeeded.
 */
export const commitTableRows = async (req: Request, res: Response) => {
    return handleImportTableRows(req, res, commitTableImport, 'commit');
}

/**
 * Executes the common import flow for preview or commit mode, records audit data, and maps internal import failures to an API response with the correct status.
 */
const handleImportTableRows = async (
    req: Request,
    res: Response,
    importTableRows: (data: TableImportRequestDto) => Promise<{rowsInserted: number}>,
    operation: 'preview' | 'commit',
) => {
    const schemaName = req.params[schemaDescriptor] as string;
    const tableName = req.params[tableDescriptor] as string;
    const rowCount = Array.isArray(req.body?.rows) ? req.body.rows.length : 0;
    const auditContext = {
        requestId: req.requestId,
        userName: req.userName,
        operation,
        schemaName,
        tableName,
        rowCount,
    };
    logger.info('table_import_requested', auditContext);
    try {
        const result = await importTableRows({
            schemaName,
            tableName,
            rows: req.body.rows,
        });
        logger.info('table_import_result', {
            ...auditContext,
            resultStatus: 'success',
            rowsInserted: result.rowsInserted,
        });
        res.json({
            success: true,
            data: result,
        });
    } catch (error: unknown) {
        const resultStatus = classifyImportResultStatus(error);
        const httpStatusCode = error instanceof HttpError ? error.httpStatusCode : 500;
        const logPayload = {
            ...auditContext,
            resultStatus,
            httpStatusCode,
            error: error instanceof Error ? error.message : String(error),
        };

        if (resultStatus === 'failed_internal') {
            logger.error('table_import_result', logPayload);
        } else {
            logger.warn('table_import_result', logPayload);
        }
        throw error;
    }
}

