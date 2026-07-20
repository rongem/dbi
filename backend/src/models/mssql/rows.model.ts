import * as sql from "mssql";
import { readRuntimeConfig } from '../../config/runtime-config.js';
import { Column } from "../data/column.model.js";
import { Row } from "../data/row.model.js";
import { transactionPool, transactionRequest } from "../db.js";
import { HttpError } from "../rest-api/httpError.model.js";
import { ImportError } from "../data/importerror.model.js";
import { getLocale } from '../../utils/locales.function.js';

const createParamNameFromColumnName = (n: string): string => n.replace(' ', '_');
const createParamDefinitionFromColumnName = (n: string) => '@' + createParamNameFromColumnName(n);

export const insertRows = async (data: {schemaName: string, tableName: string, rows: Row[], columns: Column[], commit: boolean}) => {
    const env = readRuntimeConfig();
    const transaction = await transactionPool();
    const errors:ImportError[] = [];
    let rowCounter = 0;
    for (let i = 0; i < data.rows.length; i++) {
        const row = data.rows[i];
        try {
            const result = await insertRow({columns: data.columns, row, schemaName: data.schemaName, tableName: data.tableName, transaction});
            if (result.rowsAffected.length !== 1 || result.rowsAffected[0] !== 1) {
                errors.push({row: i, msg: getLocale(env.locale).noRowsInsertedError, rowContent: row});
            } else {
                rowCounter += result.rowsAffected[0];
            }
        } catch (error: any) {
            if (error && error.name === 'RequestError') {
                errors.push({row: i, msg: error.message, rowContent: row});
            } else {
                await transaction.rollback();
                throw new HttpError(500, error?.message ?? error.toString(), {row});
            }
        }
    }
    if (errors.length > 0) {
        await transaction.rollback();
        throw new HttpError(400, getLocale(env.locale).importError, {errors});
    }
    if (data.commit) {
        await transaction.commit();
    } else {
        await transaction.rollback();
    }
    return rowCounter;
};

const insertRow = async (data: {columns: Column[]; row: Row; schemaName: string; tableName: string; transaction: sql.Transaction }) => {
    const rowKeys = Object.keys(data.row).map(k => k.toLocaleLowerCase());
    const columnNames = data.columns.map(c => c.name).filter(c => rowKeys.includes(c.toLocaleLowerCase()));
    const columnNamesList = columnNames.join('], [');
    const paramNames = columnNames.map(createParamDefinitionFromColumnName);
    const paramNamesList = paramNames.join(', ');
    const sqlCommand = `INSERT INTO [${data.schemaName}].[${data.tableName}] ([${columnNamesList}]) VALUES (${paramNamesList});`;
    const req = await transactionRequest(data.transaction, { requestTimeout: 60000 });
    for (let col of columnNames) {
        const key = Object.keys(data.row).find(k => k.toLocaleLowerCase() === col.toLocaleLowerCase())!;
        let value: any = data.row[key];
        req.input(createParamNameFromColumnName(col), value);
    }
    return await req.query(sqlCommand);
};
