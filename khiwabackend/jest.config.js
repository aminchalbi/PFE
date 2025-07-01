module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./tests/utils/testSetup.js'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/'
  ],
  testTimeout: 30000
};