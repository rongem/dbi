/// <reference path="../../custom_types/node-test/index.d.ts" />

import { HttpError } from '../models/rest-api/httpError.model.js';
import { classifyImportResultStatus } from './import-audit.js';

it('classifies 4xx import errors as failed_validation', async () => {
    const status = classifyImportResultStatus(new HttpError(400, 'validation'));
    expect(status).toBe('failed_validation');
});

it('classifies 5xx import errors as failed_internal', async () => {
    const status = classifyImportResultStatus(new HttpError(500, 'server'));
    expect(status).toBe('failed_internal');
});

it('classifies unknown errors as failed_internal', async () => {
    const status = classifyImportResultStatus(new Error('boom'));
    expect(status).toBe('failed_internal');
});
