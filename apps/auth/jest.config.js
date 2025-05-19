module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/'],
  moduleNameMapper: {
    '^@app/common(|/.*)$': '<rootDir>/../../libs/common/src/$1',
    '^@app/infrastructure(|/.*)$': '<rootDir>/../../libs/infrastructure/src/$1',
    '^@app/auth(|/.*)$': '<rootDir>/src/$1',
    '^@app/auth/domain/entity$': '<rootDir>/src/domain/entity',
    '^@app/auth/domain/entity/(.*)$': '<rootDir>/src/domain/entity/$1'
  },
}; 