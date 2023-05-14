import { SqlType } from "./sqltype";
import { Table } from "./table.model";
import { tsTypeInfo } from "./typeshelper";

export interface Column {
    table: Table;
    name: string;
    ordinalPosition: number;
    hasDefaultValue: boolean;
    isNullable: boolean;
    dataType: SqlType;
    characterData?: {
        maximumCharacterLenght: number;
        characterSetName: string;
        collationName: string;
    };
    numericData?: {
        numericPrecision: number;
        numericScale: number;
    };
    typeInfo: tsTypeInfo;
}