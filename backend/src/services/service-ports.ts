import { readRuntimeConfig } from '../config/runtime-config.js';

export type ReadConfigDependency = {
    readConfig?: typeof readRuntimeConfig;
};

export type RepositoryDependency<TRepository> = {
    repository?: TRepository;
};

export const getReadConfig = (dependencies?: ReadConfigDependency) => dependencies?.readConfig ?? readRuntimeConfig;

export const getRepository = <TRepository>(dependencies: RepositoryDependency<TRepository> | undefined, defaultRepository: TRepository) => {
    return dependencies?.repository ?? defaultRepository;
};