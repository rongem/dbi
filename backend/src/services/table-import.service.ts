import type { TableImportRequestDto, TableImportResultDto } from '../models/dto/table-import.dto.js';
import { defaultTableRepository, type TableRepository } from '../repositories/table.repository.js';
import { getReadConfig, getRepository, type ReadConfigDependency, type RepositoryDependency } from './service-ports.js';
import { ensureProtectedTableIsNotTargeted } from './protected-table.js';

type TableImportDependencies = RepositoryDependency<TableRepository> & ReadConfigDependency;

const executeTableImport = async (data: TableImportRequestDto, commit: boolean, dependencies?: TableImportDependencies): Promise<TableImportResultDto> => {
    const env = getReadConfig(dependencies)();
    ensureProtectedTableIsNotTargeted({
        schemaName: data.schemaName,
        tableName: data.tableName,
        protectedTableName: env.authTableName,
        localeName: env.locale,
    });
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