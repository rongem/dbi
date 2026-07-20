import type { Column } from '../models/data/column.model.js';
import { defaultTableRepository, type TableRepository } from '../repositories/table.repository.js';

type TableServiceDependencies = {
    repository?: TableRepository;
};

const getRepository = (dependencies?: TableServiceDependencies) => dependencies?.repository ?? defaultTableRepository;

export const listTables = async (dependencies?: TableServiceDependencies) => {
    return getRepository(dependencies).listTables();
};

export const getTableColumns = async (schemaName: string, tableName: string, dependencies?: TableServiceDependencies): Promise<Column[]> => {
    return getRepository(dependencies).getTableColumns(schemaName, tableName);
};
