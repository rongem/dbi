/// <reference path="../../custom_types/node-test/index.d.ts" />

import { attachRequestContext } from './request-context.middleware.js';

it('creates request id when header is missing', async () => {
    const req = {
        header: () => undefined,
    } as any;
    const headers: Record<string, string> = {};
    const res = {
        setHeader: (name: string, value: string) => {
            headers[name] = value;
        },
    } as any;
    let nextCalled = false;

    attachRequestContext(req, res, () => {
        nextCalled = true;
    });

    expect(nextCalled).toBe(true);
    expect(req.requestId).toBeDefined();
    expect(headers['x-request-id']).toBe(req.requestId);
});

it('reuses provided request id header', async () => {
    const req = {
        header: (name: string) => name === 'x-request-id' ? 'client-id-1' : undefined,
    } as any;
    const headers: Record<string, string> = {};
    const res = {
        setHeader: (name: string, value: string) => {
            headers[name] = value;
        },
    } as any;

    attachRequestContext(req, res, () => undefined);

    expect(req.requestId).toBe('client-id-1');
    expect(headers['x-request-id']).toBe('client-id-1');
});
