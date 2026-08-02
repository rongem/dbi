declare interface ExpectMatcher {
    toBe(expected: unknown): any;
    toBeDefined(): any;
    toBeGreaterThanOrEqual(expected: number): any;
    toContain(expected: unknown): any;
    toStrictEqual(expected: unknown): any;
    toBeTruthy(): any;
    toBeUndefined(): any;
    toBeNull(): any;
}

declare const expect: (value: unknown) => ExpectMatcher;
declare const it: any;
declare const test: any;
declare const describe: any;
declare const beforeEach: any;
declare const afterEach: any;
declare const beforeAll: any;
declare const afterAll: any;
declare const jest: { setTimeout(ms: number): void };

export {};
