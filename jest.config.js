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
  // text reporters only: avoids writing coverage/lcov-report/*.html into
  // the workspace, which CodeQL would otherwise scan and flag for XSS in
  // jest's bundled report viewer (sorter.js).
  coverageReporters: ['text', 'text-summary', 'json-summary'],
};
