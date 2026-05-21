/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  transform: {},

  // Measure every compiled production file, not just the ones tests happen
  // to import. Without `collectCoverageFrom`, jest puts only test-imported
  // files into the denominator — an untested module silently scores 100%
  // because it isn't measured at all. (The 2026-05-21 second-pass audit
  // caught the previous config reporting "100% coverage" while
  // `dist/index.js` and `dist/config.js` were absent from the report.)
  collectCoverageFrom: ['dist/**/*.js'],

  // `dist/index.js` is the stdio entry point — importing it eagerly runs
  // `await server.connect(transport)` at module top level, which would
  // hang jest. Integration testing of the entry point belongs in a
  // separate harness. Document the exclusion explicitly so it can't
  // quietly drift back into "looks fine, isn't".
  coveragePathIgnorePatterns: ['/node_modules/', 'dist/index\\.js$'],

  // Threshold reflects the production code unit tests actually cover.
  // Lowering on a clean re-baseline is fine; lowering to mask a new
  // uncovered file is the failure mode this gate is designed to catch.
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 60,
      functions: 90,
      lines: 90,
    },
  },

  // text reporters only: avoids writing coverage/lcov-report/*.html into
  // the workspace, which CodeQL would otherwise scan and flag for XSS in
  // jest's bundled report viewer (sorter.js).
  coverageReporters: ['text', 'text-summary', 'json-summary'],
};
