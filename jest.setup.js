/* eslint-env jest */

jest.mock(
  '@react-native-async-storage/async-storage',
  () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

require('react-native-gesture-handler/jestSetup');

jest.mock('react-native-geolocation-service', () => ({
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
  stopObserving: jest.fn(),
}));

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(async () => ({isConnected: true})),
  useNetInfo: jest.fn(() => ({isConnected: true})),
}));

jest.mock('react-native-permissions', () => require('react-native-permissions/mock'));

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    displayNotification: jest.fn(),
    createChannel: jest.fn(),
  },
  AndroidImportance: {HIGH: 4},
  AndroidStyle: {BIGTEXT: 1},
}));

jest.mock('@react-native-firebase/messaging', () => {
  const messaging = jest.fn(() => ({
    onMessage: jest.fn(),
    setBackgroundMessageHandler: jest.fn(),
    onNotificationOpenedApp: jest.fn(),
    getInitialNotification: jest.fn(async () => null),
    getToken: jest.fn(async () => null),
  }));

  return {__esModule: true, default: messaging};
});

jest.mock('react-native-razorpay', () => ({
  __esModule: true,
  default: {open: jest.fn(async () => ({}))},
}));

jest.mock('react-native-splash-screen', () => ({
  hide: jest.fn(),
  show: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const passthrough = ({children}) => children;
  const insets = {top: 0, right: 0, bottom: 0, left: 0};
  const SafeAreaInsetsContext = React.createContext(insets);

  return {
    SafeAreaProvider: passthrough,
    SafeAreaView: passthrough,
    SafeAreaInsetsContext,
    SafeAreaConsumer: SafeAreaInsetsContext.Consumer,
    useSafeAreaInsets: jest.fn(() => insets),
    useSafeAreaFrame: jest.fn(() => ({x: 0, y: 0, width: 390, height: 844})),
  };
});
