import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '../../../',
  testMatch: ['<rootDir>/test/integration/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/test/integration/setup.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  testTimeout: 30000,
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/**/*.test.{ts,tsx}'],
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
}

export default config
