export default {
  rootDir: './',
  verbose: true,
  bail: 1,
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  moduleFileExtensions: ['js', 'json', 'node'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^.+-\\.(mjs)$': '<rootDir>/($1)'
  },
  globals: {
    'ts-jest': {
      useESM: true
    }
  },
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: ['<rootDir>/node_modules/(?!(\\.mjs|logger.js))$']
};
