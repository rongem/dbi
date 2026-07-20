import type { TableImportRequestDto, TableImportResultDto } from '../models/dto/table-import.dto.js';
import { defaultTableRepository, type TableRepository } from '../repositories/table.repository.js';
import { getRepository, type RepositoryDependency } from './service-ports.js';

type TableImportDependencies = RepositoryDependency<TableRepository>;

const executeTableImport = async (data: TableImportRequestDto, commit: boolean, dependencies?: TableImportDependencies): Promise<TableImportResultDto> => {
    const repository = getRepository(dependencies, defaultTableRepository);
    const columns = await repository.getTableColumns(data.schemaName, data.tableName);
    const rowsInserted = await repository.insertTableRows({...data, columns, commit});
    return {rowsInserted};
};

export const previewTableImport = async (data: TableImportRequestDto, dependencies?: TableImportDependencies): Promise<TableImportResultDto> => {
    return executeTableImport(data, false, dependencies);
};

export const commitTableImport = async (data: TableImportRequestDto, dependencies?: TableImportDependencies): Promise<TableImportResultDto> => {
    return executeTableImport(data, true, dependencies);
};