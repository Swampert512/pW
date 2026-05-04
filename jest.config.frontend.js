/**
 * Jest configuration para tests del frontend
 * Usa jsdom para simular el DOM del navegador
 */

module.exports = {
  displayName: 'frontend',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests/frontend'],
  testMatch: ['**/__tests__/**/*.ts', '**/*.test.ts'],
  preset: 'ts-jest',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'frontend/src/**/*.ts',
    '!frontend/src/**/*.d.ts',
    '!frontend/src/app.ts' // Entry point
  ],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/frontend/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/frontend/src/$1'
  }
};
