import { RequestError, Transaction } from "mssql";
import { Column } from "../data/column.model";
import { Row } from "../data/row.model";
import { transactionPool, transactionRequest } from "../db";
import { HttpError } from "../rest-api/httpError.model";

const createParamNameFromColumnName = (n: string): string => n.replace(' ', '_');
const createParamDefinitionFromColumnName = (n: string) => '@' + createParamNameFromColumnName(n);

export const insertRows = async (data: {schemaName: string, tableName: string, rows: Row[], columns: Column[], commit: boolean}) => {
    const columnNames = data.columns.map(c => c.name);
    const columnNamesList = columnNames.join('], [');
    const paramNames = columnNames.map(createParamDefinitionFromColumnName);
    const paramNamesList = paramNames.join(', ');
    const sqlCommand = `INSERT INTO [${data.schemaName}].[${data.tableName}] ([${columnNamesList}]) VALUES (${paramNamesList});`;
    const transaction = await transactionPool();
    for (let i = 0; i < data.rows.length; i++) {
        const row = data.rows[i];
        try {
            const result = await insertRow({columns: data.columns, row, sqlCommand, transaction});
            if (result.rowsAffected.length !== 1 || result.rowsAffected[0] !== 1) {
                throw new Error("Insert failed on row " + i.toString(), {cause: result.output});
            }
        } catch (error: any) {
            transaction.rollback();
            if (error instanceof RequestError) {
                throw new HttpError(400, 'Error line ' + i.toString() + ': ' + error.message, row);
            } else {
                throw new HttpError(500, error?.message ?? error.toString(), row);
            }
        }
    }
    if (data.commit) {
        await transaction.commit();
    } else {
        await transaction.rollback();
    }
};

const insertRow = async (data: {columns: Column[]; row: Row; sqlCommand: string; transaction: Transaction }) => {
    const req = await transactionRequest(data.transaction);
    for (let col of data.columns) {
        const key = Object.keys(data.row).find(k => k.toLocaleLowerCase() === col.name.toLocaleLowerCase())!;
        req.input(createParamNameFromColumnName(col.name), data.row[key]);
    }
    return req.query(data.sqlCommand);
};