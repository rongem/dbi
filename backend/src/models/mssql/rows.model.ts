import { RequestError, Transaction } from "mssql";
import { Column } from "../data/column.model";
import { Row } from "../data/row.model";
import { transactionPool, transactionRequest } from "../db";
import { HttpError } from "../rest-api/httpError.model";
import { ImportError } from "../data/importerror.model";

const createParamNameFromColumnName = (n: string): string => n.replace(' ', '_');
const createParamDefinitionFromColumnName = (n: string) => '@' + createParamNameFromColumnName(n);

export const insertRows = async (data: {schemaName: string, tableName: string, rows: Row[], columns: Column[], commit: boolean}) => {
    const transaction = await transactionPool();
    const errors:ImportError[] = [];
    let rowCounter = 0;
    for (let i = 0; i < data.rows.length; i++) {
        const row = data.rows[i];
        try {
            const result = await insertRow({columns: data.columns, row, schemaName: data.schemaName, tableName: data.tableName, transaction});
            console.log(result.rowsAffected);
            if (result.rowsAffected.length !== 1 || result.rowsAffected[0] !== 1) {
                errors.push({row: i, msg: 'No rows inserted', rowContent: row});
            } else {
                rowCounter += result.rowsAffected[0];
            }
        } catch (error: any) {
            console.log(error);
            if (error instanceof RequestError) {
                errors.push({row: i, msg: error.message, rowContent: row});
            } else {
                transaction.rollback();
                throw new HttpError(500, error?.message ?? error.toString(), {row});
            }
        }
    }
    if (errors.length > 0) {
        transaction.rollback();
        throw new HttpError(400, 'Errors during import', {errors});
    }
    if (data.commit) {
        await transaction.commit();
    } else {
        await transaction.rollback();
    }
    return rowCounter;
};

const insertRow = async (data: {columns: Column[]; row: Row; schemaName: string; tableName: string; transaction: Transaction }) => {
    const rowKeys = Object.keys(data.row).map(k => k.toLocaleLowerCase());
    const columnNames = data.columns.map(c => c.name).filter(c => rowKeys.includes(c.toLocaleLowerCase()));
    const columnNamesList = columnNames.join('], [');
    const paramNames = columnNames.map(createParamDefinitionFromColumnName);
    const paramNamesList = paramNames.join(', ');
    const sqlCommand = `INSERT INTO [${data.schemaName}].[${data.tableName}] ([${columnNamesList}]) VALUES (${paramNamesList});`;
    console.log(sqlCommand);
    const req = await transactionRequest(data.transaction);
    for (let col of columnNames) {
        const key = Object.keys(data.row).find(k => k.toLocaleLowerCase() === col.toLocaleLowerCase())!;
        let value: any = data.row[key];
        console.log(col, key, value);
        req.input(createParamNameFromColumnName(col), value);
    }
    console.log(req.parameters);
    return req.query(sqlCommand);
};
