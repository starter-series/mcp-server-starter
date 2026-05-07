/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  transform: {},
  // Threshold is set just below today's measured floor — fresh forks see
  // green numbers and a regression turns the gate red.
  coverageThreshold: {
    global: {
      statements: 95,
      branches: 60,
      functions: 95,
      lines: 95,
    },
  },
};
