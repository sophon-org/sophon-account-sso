import type { Config } from 'jest';

const config: Config = {
  verbose: true,
  coveragePathIgnorePatterns: [
    'app.module.ts',
    'main.ts',
    '.controller.ts',
    '.module.ts',
    '.dto.ts',
    '.schema.ts',
    '.*\\.decorator\\.ts',
    '__tests__',
    'health',
    '.*seed.*\\.ts',
    '.*prisma.*',
    'configuration.ts',
    '.*firebase.*',
    'auth.service.ts',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>$1',
    '^@auth/(.*)$': '<rootDir>/auth$1',
  },
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageReporters: ['json', 'lcov', 'text', 'clover', 'html'],
  coverageDirectory: '../coverage',
  // coverageThreshold: {
  //   global: {
  //     branches: 90, // min. branch coverage
  //     functions: 90, // min. function coverage
  //     lines: 90, // min. line coverage
  //     statements: 90, // min. statement coverage
  //   },
  // },
  testEnvironment: 'node',
};

export default config;
