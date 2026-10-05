// jest.config.js — FluenzyAI test configuration
/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        // Relax for tests — no DOM required for pure logic tests
        lib: ['ES2020'],
        module: 'CommonJS',
        target: 'ES2020',
        strict: false,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        moduleResolution: 'node',
        paths: {
          '@/*': ['./src/*'],
        },
      },
    }],
  },
  // Don't fail on type errors in tests — we just want runtime correctness
  globals: {
    'ts-jest': {
      diagnostics: false,
    },
  },
  coveragePathIgnorePatterns: ['/node_modules/', '/__tests__/'],
  testTimeout: 10000,
};

module.exports = config;
