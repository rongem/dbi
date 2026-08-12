/// <reference path="../../custom_types/node-test/index.d.ts" />

import { getTypeInformation } from '../models/data/tsTypeInfo.js';
import { logger } from './logger.js';

it('maps common SQL types to the normalized logical types', () => {
    expect(getTypeInformation('tinyint')).toStrictEqual({ sqlType: 'tinyint', allowedTypes: ['number'] });
    expect(getTypeInformation('datetime')).toStrictEqual({ sqlType: 'datetime', allowedTypes: ['string', 'date'] });
    expect(getTypeInformation('varbinary')).toStrictEqual({ sqlType: 'varbinary', allowedTypes: ['binary'] });
});

it('masks nested sensitive values in structured log entries', () => {
    const originalError = console.error;
    const captured: string[] = [];
    console.error = (...args: unknown[]) => captured.push(args.map((arg) => String(arg)).join(' '));

    try {
        logger.error('nested_sensitive', {
            user: 'alice',
            password: 'plain-text-secret',
            nested: {
                token: 'token-123',
                keep: 'visible',
            },
            list: [{ password: 'list-secret', ok: true }],
        });

        expect(captured.length).toBe(1);
        const payload = JSON.parse(captured[0]);
        expect(payload.details.password).toBe('***');
        expect(payload.details.nested.token).toBe('***');
        expect(payload.details.list[0].password).toBe('***');
        expect(payload.details.nested.keep).toBe('visible');
    } finally {
        console.error = originalError;
    }
});
