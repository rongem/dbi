import type { Column } from '../models/data/column.model.js';
import type { TableImportRequestDto, TableImportResultDto } from '../models/dto/table-import.dto.js';
import type { Row } from '../models/data/row.model.js';
import { getTableColumns } from './table.service.js';
import { defaultTableRepository, type TableRepository } from '../repositories/table.repository.js';

type TableImportDependencies = {
    repository?: TableRepository;
};

const getDependencies = (dependencies?: TableImportDependencies) => ({
    repository: dependencies?.repository ?? defaultTableRepository,
});

const executeTableImport = async (data: TableImportRequestDto, commit: boolean, dependencies?: TableImportDependencies): Promise<TableImportResultDto> => {
    const { repository } = getDependencies(dependencies);
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