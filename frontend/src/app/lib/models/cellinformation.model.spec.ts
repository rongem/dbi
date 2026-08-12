import { describe, expect, it } from 'vitest';

import { CellContent } from './cellcontent.model';
import { CellInformation } from './cellinformation.model';
import { Column } from './rest-backend/column.model';

describe('CellInformation', () => {
  const createNumberColumn = (): Column => ({
    table: { schema: 'public', name: 'orders', columns: [] as never[] },
    name: 'amount',
    ordinalPosition: 1,
    hasDefaultValue: false,
    isNullable: false,
    dataType: 'int',
    typeInfo: { allowedTypes: ['number'] },
    constraints: {
      logicalTypes: ['number'],
      number: { minimum: 0, maximum: 100 },
      enumValues: [10, 25],
    },
    primary: false,
    foreignKey: false,
    unique: false,
  } as unknown as Column);

  const createStringColumn = (): Column => ({
    table: { schema: 'public', name: 'orders', columns: [] as never[] },
    name: 'code',
    ordinalPosition: 1,
    hasDefaultValue: false,
    isNullable: false,
    dataType: 'varchar',
    typeInfo: { allowedTypes: ['string'] },
    constraints: {
      logicalTypes: ['string'],
      string: { minLength: 2, maxLength: 5 },
    },
    primary: false,
    foreignKey: false,
    unique: false,
  } as unknown as Column);

  it('accepts valid enum values within the numeric range', () => {
    const cell = new CellInformation(new CellContent('25', 0, 0), createNumberColumn());

    expect(cell.containsErrors).toBe(false);
    expect(cell.typedValue).toBe(25);
  });

  it('marks values outside the allowed range and enum set as invalid', () => {
    const cell = new CellInformation(new CellContent('120', 0, 0), createNumberColumn());

    expect(cell.containsErrors).toBe(true);
    expect(cell.errorText).toContain('Value exceeds the maximum');
    expect(cell.errorText).toContain('Value is not part of the allowed enum values');
  });

  it('enforces minimum and maximum string length', () => {
    const validCell = new CellInformation(new CellContent('abcd', 0, 0), createStringColumn());
    const invalidCell = new CellInformation(new CellContent('abcdef', 0, 0), createStringColumn());

    expect(validCell.containsErrors).toBe(false);
    expect(invalidCell.containsErrors).toBe(true);
    expect(invalidCell.errorText).toContain('Value is longer than allowed');
  });
});
