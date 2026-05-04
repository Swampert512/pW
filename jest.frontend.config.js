/**
 * Jest configuration para tests del frontend
 * Usa jsdom para simular DOM
 */

module.exports = {
  displayName: 'frontend',
  testEnvironment: 'jsdom',
  preset: 'ts-jest',
  roots: ['<rootDir>/tests/frontend'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'frontend/src/**/*.ts',
    '!frontend/src/**/*.d.ts',
    '!frontend/src/app.ts'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/frontend/setup.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true
      }
    }]
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/frontend/src/$1'
  },
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  }
};
