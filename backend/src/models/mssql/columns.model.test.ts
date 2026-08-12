/// <reference path="../../../custom_types/node-test/index.d.ts" />

import { createColumnConstraints } from './columns.model.js';

it('derives integer boundaries and scale from MSSQL numeric metadata', () => {
    const constraints = createColumnConstraints('smallint', ['number'], {
        CHARACTER_MAXIMUM_LENGTH: null,
        NUMERIC_PRECISION: 5,
        NUMERIC_SCALE: 0,
    });

    expect(constraints.logicalTypes).toStrictEqual(['number']);
    expect(constraints.number).toStrictEqual({
        minimum: -32768,
        maximum: 32767,
        integer: true,
        precision: 5,
        scale: 0,
    });
});

it('derives max length and max bytes for varchar and binary columns', () => {
    const stringConstraints = createColumnConstraints('nvarchar', ['string'], {
        CHARACTER_MAXIMUM_LENGTH: 50,
    });
    const binaryConstraints = createColumnConstraints('varbinary', ['binary'], {
        CHARACTER_MAXIMUM_LENGTH: 32,
    });

    expect(stringConstraints.string).toStrictEqual({ maxLength: 50 });
    expect(binaryConstraints.binary).toStrictEqual({ maxBytes: 32 });
});

it('keeps constraints undefined when sql metadata does not provide relevant values', () => {
    const constraints = createColumnConstraints('varchar', ['string'], {
        CHARACTER_MAXIMUM_LENGTH: null,
    });

    expect(constraints.string).toBeUndefined();
});
