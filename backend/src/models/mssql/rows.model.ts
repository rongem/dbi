import { RequestError, Transaction } from "mssql";
import { Column } from "../data/column.model";
import { Row } from "../data/row.model";
import { transactionPool, transactionRequest } from "../db";
import { HttpError } from "../rest-api/httpError.model";
import { ImportError } from "../data/importerror.model";

const createParamNameFromColumnName = (n: string): string => n.replace(' ', '_');
const createParamDefinitionFromColumnName = (n: string) => '@' + createParamNameFromColumnName(n);

export const insertRows = async (data: {schemaName: string, tableName: string, rows: Row[], columns: Column[], commit: boolean}) => {
    const columnNames = data.columns.map(c => c.name);
    const columnNamesList = columnNames.join('], [');
    const paramNames = columnNames.map(createParamDefinitionFromColumnName);
    const paramNamesList = paramNames.join(', ');
    const sqlCommand = `INSERT INTO [${data.schemaName}].[${data.tableName}] ([${columnNamesList}]) VALUES (${paramNamesList});`;
    const transaction = await transactionPool();
    const errorList:ImportError[] = [];
    let rowCounter = 0;
    for (let i = 0; i < data.rows.length; i++) {
        const row = data.rows[i];
        try {
            const result = await insertRow({columns: data.columns, row, sqlCommand, transaction});
            if (result.rowsAffected.length !== 1 || result.rowsAffected[0] !== 1) {
                errorList.push({line: i, msg: 'No rows inserted', rowContent: row});
            } else {
                rowCounter += result.rowsAffected[0];
            }
        } catch (error: any) {
            if (error instanceof RequestError) {
                errorList.push({line: i, msg: error.message, rowContent: row});
            } else {
                transaction.rollback();
                throw new HttpError(500, error?.message ?? error.toString(), row);
            }
        }
    }
    if (errorList.length > 0) {
        transaction.rollback();
        throw new HttpError(400, 'Errors during import', errorList);
    }
    if (data.commit) {
        await transaction.commit();
    } else {
        await transaction.rollback();
    }
    return rowCounter;
};

const insertRow = async (data: {columns: Column[]; row: Row; sqlCommand: string; transaction: Transaction }) => {
    const req = await transactionRequest(data.transaction);
    for (let col of data.columns) {
        const key = Object.keys(data.row).find(k => k.toLocaleLowerCase() === col.name.toLocaleLowerCase())!;
        req.input(createParamNameFromColumnName(col.name), data.row[key]);
    }
    return req.query(data.sqlCommand);
};
