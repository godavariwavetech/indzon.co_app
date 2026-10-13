const reactNativePreset = require('react-native/jest-preset');

module.exports = {
  ...reactNativePreset,
  setupFiles: [
    ...reactNativePreset.setupFiles,
    '<rootDir>/jest.setup.js',
  ],
  transform: {
    ...reactNativePreset.transform,
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|react-native-[^/]+|@react-native|@react-native-[^/]+|@react-navigation|react-redux|@reduxjs|immer)/)',
  ],
};
