/** @type {import('ts-jest').JestConfigWithTsJest} */
const jestConfig = {
  // Zwingt Jest dazu, .ts-Dateien nativ als ES-Module zu behandeln
  extensionsToTreatAsEsm: ['.ts'],
  
  testEnvironment: 'node',

  setupFilesAfterEnv: [
    './src/test/setup.ts'
  ],

  transform: {
    // Verwendet ts-jest und lädt die spezifische Jest-TS-Konfiguration
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: './tsconfig.jest.json'
      },
    ],
  },

  // Mappt Ihre manuell geänderten .js-Endungen im Testlauf zurück auf .ts
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};

export default jestConfig;