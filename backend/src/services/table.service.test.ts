/// <reference path="../../custom_types/node-test/index.d.ts" />

import { getTableColumns } from './table.service.js';

it('rejects protected authorization table on column lookup', async () => {
    try {
        await getTableColumns('dbo', '_Authorizations', {
            readConfig: () => ({
                authTableName: '_Authorizations',
                locale: 'en',
            } as any),
            repository: {
                listTables: async () => [],
                getTableColumns: async () => [],
                insertTableRows: async () => 0,
            },
        });
        expect(true).toBe(false);
    } catch (error: any) {
        expect(error.httpStatusCode).toBe(403);
    }
});
