import { SqlType } from "./sqltype.js";
import { Table } from "./table.model.js";
import { tsTypeInfo } from "./tsTypeInfo.js";
import { ColumnConstraints } from "./column-constraints.model.js";

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
