/// <reference path="../../custom_types/node-test/index.d.ts" />

import { Column } from '../models/data/column.model.js';
import { isCellCompatibleWithColumn } from './validators.js';

const baseColumn: Column = {
    table: { name: 'Example', schema: 'dbo' },
    name: 'ExampleColumn',
    ordinalPosition: 1,
    hasDefaultValue: false,
    isNullable: false,
    dataType: 'nvarchar',
    typeInfo: { sqlType: 'nvarchar', allowedTypes: ['string'] },
    primary: false,
    foreignKey: false,
    unique: false,
};

const createColumn = (override: Partial<Column>): Column => ({
    ...baseColumn,
    ...override,
});

it('uses legacy allowedTypes when constraints are missing', () => {
    const column = createColumn({
        typeInfo: { sqlType: 'bit', allowedTypes: ['boolean'] },
    });

    expect(isCellCompatibleWithColumn(true, column)).toBe(true);
    expect(isCellCompatibleWithColumn('true', column)).toBe(false);
});

it('rejects values outside configured enum values', () => {
    const column = createColumn({
        constraints: {
            logicalTypes: ['string'],
            enumValues: ['A', 'B'],
        },
    });

    expect(isCellCompatibleWithColumn('A', column)).toBe(true);
    expect(isCellCompatibleWithColumn('C', column)).toBe(false);
});

it('validates string length constraints', () => {
    const column = createColumn({
        constraints: {
            logicalTypes: ['string'],
            string: { minLength: 2, maxLength: 4 },
        },
    });

    expect(isCellCompatibleWithColumn('AB', column)).toBe(true);
    expect(isCellCompatibleWithColumn('A', column)).toBe(false);
    expect(isCellCompatibleWithColumn('ABCDE', column)).toBe(false);
});

it('validates number range and integer constraints', () => {
    const column = createColumn({
        typeInfo: { sqlType: 'smallint', allowedTypes: ['number'] },
        constraints: {
            logicalTypes: ['number'],
            number: { minimum: -32768, maximum: 32767, integer: true },
        },
    });

    expect(isCellCompatibleWithColumn(12, column)).toBe(true);
    expect(isCellCompatibleWithColumn(12.5, column)).toBe(false);
    expect(isCellCompatibleWithColumn(40000, column)).toBe(false);
});

it('validates byte constraints for binary logical types', () => {
    const column = createColumn({
        constraints: {
            logicalTypes: ['binary'],
            binary: { maxBytes: 2 },
        },
    });

    expect(isCellCompatibleWithColumn('AB', column)).toBe(true);
    expect(isCellCompatibleWithColumn('ABC', column)).toBe(false);
    expect(isCellCompatibleWithColumn('€', column)).toBe(false);
});
