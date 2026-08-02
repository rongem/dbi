import type { Column } from '../models/data/column.model.js';
import { defaultTableRepository, type TableRepository } from '../repositories/table.repository.js';
import { ensureProtectedTableIsNotTargeted } from './protected-table.js';
import { getReadConfig, getRepository, type ReadConfigDependency, type RepositoryDependency } from './service-ports.js';

type TableServiceDependencies = RepositoryDependency<TableRepository> & ReadConfigDependency;

export const listTables = async (dependencies?: TableServiceDependencies) => {
    return getRepository(dependencies, defaultTableRepository).listTables();
};

export const getTableColumns = async (schemaName: string, tableName: string, dependencies?: TableServiceDependencies): Promise<Column[]> => {
    const env = getReadConfig(dependencies)();
    ensureProtectedTableIsNotTargeted({
        schemaName,
        tableName,
        protectedTableName: env.authTableName,
        localeName: env.locale,
    });
    return getRepository(dependencies, defaultTableRepository).getTableColumns(schemaName, tableName);
};
