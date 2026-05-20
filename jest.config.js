module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // Narrow gate: App smoke test touches these modules; full-screen coverage belongs in feature tests.
  collectCoverageFrom: [
    'src/query/queryClient.ts',
    'src/theme/AppColors.ts',
    'src/third-party/i18n/i18n.ts',
    'src/third-party/i18n/getDeviceLanguageTag.ts',
  ],
  coveragePathIgnorePatterns: ['/node_modules/'],
  coverageThreshold: {
    global: { lines: 80 },
  },
};
