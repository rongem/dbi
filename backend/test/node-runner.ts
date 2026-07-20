import assert from 'node:assert/strict';
import * as nodeTest from 'node:test';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';

const envPath = resolve(process.cwd(), './src/test/.env');
if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf8');
    for (const line of envContent.split(/\r?\n/)) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('#')) {
            continue;
        }
        const separatorIndex = trimmedLine.indexOf('=');
        if (separatorIndex === -1) {
            continue;
        }
        const key = trimmedLine.slice(0, separatorIndex).trim();
        const value = trimmedLine.slice(separatorIndex + 1).trim();
        if (!(key in process.env)) {
            process.env[key] = value;
        }
    }
}

declare global {
    var expect: (value: unknown) => {
        toBe: (expected: unknown) => any;
        toBeDefined: () => any;
        toBeGreaterThanOrEqual: (expected: number) => any;
        toContain: (expected: unknown) => any;
        toStrictEqual: (expected: unknown) => any;
        toBeTruthy: () => any;
        toBeUndefined: () => any;
        toBeNull: () => any;
    };
    var jest: { setTimeout: (ms: number) => void };
    var it: typeof nodeTest.test;
    var test: typeof nodeTest.test;
    var describe: typeof nodeTest.describe;
    var beforeEach: typeof nodeTest.beforeEach;
    var afterEach: typeof nodeTest.afterEach;
    var beforeAll: typeof nodeTest.before;
    var afterAll: typeof nodeTest.after;
}

globalThis.test = nodeTest.test as any;
globalThis.it = nodeTest.test as any;
globalThis.describe = nodeTest.describe as any;
globalThis.beforeEach = nodeTest.beforeEach as any;
globalThis.afterEach = nodeTest.afterEach as any;
globalThis.beforeAll = nodeTest.before as any;
globalThis.afterAll = nodeTest.after as any;

let defaultTimeout = 0;

globalThis.expect = (actual: unknown) => {
    return {
        toBe(expected: unknown) {
            assert.strictEqual(actual, expected);
            return this;
        },
        toBeDefined() {
            assert.notStrictEqual(actual, undefined);
            return this;
        },
        toBeGreaterThanOrEqual(expected: number) {
            assert.ok(
                typeof actual === 'number' && actual >= expected,
                `Expected ${String(actual)} to be greater than or equal to ${expected}`
            );
            return this;
        },
        toContain(expected: unknown) {
            if (typeof actual === 'string') {
                assert.ok(
                    actual.includes(String(expected)),
                    `Expected ${JSON.stringify(actual)} to contain ${JSON.stringify(expected)}`
                );
            } else if (Array.isArray(actual)) {
                assert.ok(
                    actual.includes(expected),
                    `Expected ${JSON.stringify(actual)} to contain ${JSON.stringify(expected)}`
                );
            } else if (actual && typeof (actual as any).includes === 'function') {
                assert.ok(
                    (actual as any).includes(expected),
                    `Expected ${JSON.stringify(actual)} to contain ${JSON.stringify(expected)}`
                );
            } else {
                throw new assert.AssertionError({
                    message: `toContain is not supported for ${typeof actual}`,
                });
            }
            return this;
        },
        toStrictEqual(expected: unknown) {
            assert.deepStrictEqual(actual, expected);
            return this;
        },
        toBeTruthy() {
            assert.ok(actual, `Expected ${JSON.stringify(actual)} to be truthy`);
            return this;
        },
        toBeUndefined() {
            assert.strictEqual(actual, undefined);
            return this;
        },
        toBeNull() {
            assert.strictEqual(actual, null);
            return this;
        },
    };
};

globalThis.jest = {
    setTimeout(ms: number) {
        defaultTimeout = ms;
    },
};

type TestFunction = typeof nodeTest.test;
const createTestWrapper = (original: TestFunction) => {
    const wrapper = (...args: any[]) => {
        // only pass timeout when it's a positive number; 0 means no timeout option
        if (args.length === 2 && typeof args[1] === 'function') {
            if (defaultTimeout > 0) return original(args[0], { timeout: defaultTimeout }, args[1]);
            return original(args[0], args[1]);
        }
        if (args.length === 3) {
            const [name, opts, fn] = args;
            if (defaultTimeout > 0) return original(name, { ...opts, timeout: defaultTimeout }, fn);
            return original(name, opts, fn);
        }
        return original(...args);
    };
    Object.assign(wrapper, original);
    return wrapper as any as TestFunction;
};

globalThis.test = createTestWrapper(nodeTest.test);
globalThis.it = createTestWrapper(nodeTest.test);
globalThis.describe = nodeTest.describe as any;
globalThis.beforeEach = nodeTest.beforeEach as any;
globalThis.afterEach = nodeTest.afterEach as any;

const collectTestFiles = (directory: string): string[] => {
    const entries = readdirSync(directory, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
        const fullPath = resolve(directory, entry.name);
        if (entry.isDirectory()) {
            files.push(...collectTestFiles(fullPath));
            continue;
        }
        if (entry.isFile() && entry.name.endsWith('.test.js')) {
            files.push(fullPath);
        }
    }

    return files.sort();
};

const cliTestFiles = process.argv.slice(2).map(file => resolve(process.cwd(), file));
const discoveredTestRoot = resolve(process.cwd(), 'dist-test/src');
const testFiles = cliTestFiles.length > 0
    ? cliTestFiles
    : existsSync(discoveredTestRoot) && statSync(discoveredTestRoot).isDirectory()
        ? collectTestFiles(discoveredTestRoot)
        : [];

if (testFiles.length === 0) {
    throw new Error('No test files found for node-runner.ts');
}

for (const testFile of testFiles) {
    const fileUrl = pathToFileURL(testFile).href;
    await import(fileUrl);
}

await nodeTest.run();
