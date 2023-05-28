import { Transaction } from "mssql";
import { Column } from "../data/column.model";
import { Row } from "../data/row.model";
import { transactionPool, transactionRequest } from "../db";

const createParamNameFromColumnName = (n: string): string => '@' + n.replace(' ', '_');

export const insertRows = async (data: {schemaName: string, tableName: string, rows: Row[], columns: Column[], commit: boolean}) => {
    const columnNames = data.columns.map(c => c.name);
    const columnNamesList = columnNames.join('], [');
    const paramNames = columnNames.map(createParamNameFromColumnName);
    const paramNamesList = paramNames.join(', ');
    const sqlCommand = `INSERT INTO ${data.schemaName}.${data.tableName} ([${columnNamesList}]) VALUES ${paramNamesList}`;
    const transaction = await transactionPool();
    try {
        for (let i = 0; i < data.rows.length; i++) {
            const row = data.rows[i];
            const result = await insertRow({columns: data.columns, row, sqlCommand, transaction}).catch(reason => {
                console.log(reason);
                throw new Error('Insert error on row' + i.toString(), {cause: reason});
            });
            if (result.rowsAffected.length !== 1 || result.rowsAffected[0] !== 1) {
                throw new Error("Insert failed on row" + i.toString());
            }
        }
        if (data.commit) {
            await transaction.commit();
        } else {
            await transaction.rollback();
        }
    } catch (error: any) {
        await transaction.rollback();
        console.log(error);
        throw new Error('Insert failed', {cause: error});
    }
};

async function insertRow(data: {columns: Column[]; row: Row; sqlCommand: string; transaction: Transaction }) {
    const req = await transactionRequest(data.transaction);
    for (let col of data.columns) {
        const key = Object.keys(data.row).find(k => k.toLocaleLowerCase() === col.name.toLocaleLowerCase())!;
        req.input(createParamNameFromColumnName(col.name), data.row[key]);
    }
    return req.execute(data.sqlCommand);
}
