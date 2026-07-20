import type { Column } from '../models/data/column.model.js';
import { defaultTableRepository, type TableRepository } from '../repositories/table.repository.js';
import { getRepository, type RepositoryDependency } from './service-ports.js';

type TableServiceDependencies = RepositoryDependency<TableRepository>;

export const listTables = async (dependencies?: TableServiceDependencies) => {
    return getRepository(dependencies, defaultTableRepository).listTables();
};

export const getTableColumns = async (schemaName: string, tableName: string, dependencies?: TableServiceDependencies): Promise<Column[]> => {
    return getRepository(dependencies, defaultTableRepository).getTableColumns(schemaName, tableName);
};
