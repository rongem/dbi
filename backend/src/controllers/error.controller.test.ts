/// <reference path="../../custom_types/node-test/index.d.ts" />

import { HttpError } from '../models/rest-api/httpError.model.js';
import { normalizeError } from './error.controller.js';

it('masks message and details for HttpError 500 responses', async () => {
    const normalized = normalizeError(new HttpError(500, 'sensitive db error', { sql: 'SELECT * FROM secret' }));

    expect(normalized.status).toBe(500);
    expect(normalized.body.error.message).toBe('Internal server error.');
    expect(normalized.body.error.details).toBe(undefined);
});

it('keeps message/details for client errors', async () => {
    const normalized = normalizeError(new HttpError(403, 'forbidden', { reason: 'policy' }));

    expect(normalized.status).toBe(403);
    expect(normalized.body.error.message).toBe('forbidden');
    expect(normalized.body.error.details).toStrictEqual({ reason: 'policy' });
});
