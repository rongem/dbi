import type * as nodeTest from 'node:test';

declare global {
    interface ExpectMatcher {
        toBe(expected: unknown): any;
        toBeDefined(): any;
        toBeGreaterThanOrEqual(expected: number): any;
        toContain(expected: unknown): any;
        toStrictEqual(expected: unknown): any;
        toBeTruthy(): any;
        toBeUndefined(): any;
        toBeNull(): any;
    }

    var expect: (value: unknown) => ExpectMatcher;
    var it: typeof nodeTest.test;
    var test: typeof nodeTest.test;
    var describe: typeof nodeTest.describe;
    var beforeEach: typeof nodeTest.beforeEach;
    var afterEach: typeof nodeTest.afterEach;
    var beforeAll: typeof nodeTest.before;
    var afterAll: typeof nodeTest.after;
    var jest: { setTimeout(ms: number): void };
}

export {};
