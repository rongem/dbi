export type ColumnLogicalType = 'string' | 'number' | 'boolean' | 'date' | 'binary';

export interface ColumnStringConstraints {
    minLength?: number;
    maxLength?: number;
}

export interface ColumnNumberConstraints {
    minimum?: number;
    maximum?: number;
    integer?: boolean;
    precision?: number;
    scale?: number;
}

export interface ColumnBinaryConstraints {
    maxBytes?: number;
}

export interface ColumnDateConstraints {
    format?: 'date' | 'date-time' | 'time';
}

export interface ColumnConstraints {
    logicalTypes: ColumnLogicalType[];
    enumValues?: Array<string | number | boolean>;
    string?: ColumnStringConstraints;
    number?: ColumnNumberConstraints;
    binary?: ColumnBinaryConstraints;
    date?: ColumnDateConstraints;
    extensions?: Record<string, unknown>;
}
