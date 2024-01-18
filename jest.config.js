module.exports = {
  verbose: true,
  collectCoverage: true,
  collectCoverageFrom: [
    'src/*.js',
  ],
  transform: {
    '\\.js$': 'babel-jest',
  },
  testEnvironment: 'jsdom',
  setupFiles: [
    './test/__mock__/client.js',
  ],
};
