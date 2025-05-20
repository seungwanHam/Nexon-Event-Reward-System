module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testMatch: ['<rootDir>/apps/**/*.spec.ts'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  roots: ['<rootDir>/apps/', '<rootDir>/libs/'],
  moduleNameMapper: {
    '^@app/common(|/.*)$': '<rootDir>/libs/common/src/$1',
    '^@app/infrastructure(|/.*)$': '<rootDir>/libs/infrastructure/src/$1',
    '^@app/libs/common(|/.*)$': '<rootDir>/libs/common/src/$1',
    '^@app/libs/infrastructure(|/.*)$': '<rootDir>/libs/infrastructure/src/$1',
    '^@app/libs/auth(|/.*)$': '<rootDir>/libs/auth/src/$1'
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  verbose: true,
}; 