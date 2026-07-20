import { commitTableImport, previewTableImport } from './table-import.service.js';

const tableColumn = {
    table: {name: 'Example', schema: 'dbo'},
    name: 'name',
    ordinalPosition: 1,
    hasDefaultValue: false,
    isNullable: false,
    dataType: 'nvarchar',
    typeInfo: {sqlType: 'nvarchar', allowedTypes: ['string']},
    primary: false,
    foreignKey: false,
    unique: false,
} as const;

it('previews import without committing', async () => {
    const calls: Array<{schemaName: string; tableName: string; rows: unknown[]; columns: unknown[]; commit: boolean}> = [];

    const result = await previewTableImport({
        schemaName: 'dbo',
        tableName: 'Example',
        rows: [{name: 'a'}],
    }, {
        repository: {
            getTableColumns: async () => [tableColumn as any],
            insertTableRows: async (data) => {
                calls.push(data as any);
                return 0;
            },
            listTables: async () => [],
        },
    });

    expect(result.rowsInserted).toBe(0);
    expect(calls[0].commit).toBe(false);
});

it('commits import when requested', async () => {
    let commitValue: boolean | undefined;

    await commitTableImport({
        schemaName: 'dbo',
        tableName: 'Example',
        rows: [{name: 'a'}],
    }, {
        repository: {
            getTableColumns: async () => [tableColumn as any],
            insertTableRows: async (data) => {
                commitValue = data.commit;
                return 1;
            },
            listTables: async () => [],
        },
    });

    expect(commitValue).toBe(true);
});