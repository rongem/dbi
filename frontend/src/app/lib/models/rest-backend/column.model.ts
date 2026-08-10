import { SqlType } from "./sqltype";
import { Table } from "./table.model";
import { tsTypeInfo } from "./tsTypeInfo";
import { ColumnConstraints } from "./column-constraints.model";

export interface Column {
    table: Table;
    name: string;
    ordinalPosition: number;
    hasDefaultValue: boolean;
    isNullable: boolean;
    dataType: SqlType;
    characterData?: {
        maximumCharacterLength: number;
        characterSetName: string;
        collationName: string;
    };
    numericData?: {
        numericPrecision: number;
        numericScale: number;
    };
    typeInfo: tsTypeInfo;
    constraints?: ColumnConstraints;
    primary: boolean;
    foreignKey: boolean;
    foreignKeyInformation?: {
        schema: string;
        table: string;
        column: string;
    };
    unique: boolean;
}
