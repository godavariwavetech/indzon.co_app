// Push notifications are not available in the web build.
const messaging = () => ({
  requestPermission: async () => 1,
  hasPermission: async () => 1,
  getToken: async () => null,
  onMessage: () => () => {},
  onTokenRefresh: () => () => {},
  onNotificationOpenedApp: () => () => {},
  getInitialNotification: async () => null,
  setBackgroundMessageHandler: () => {},
});
messaging.AuthorizationStatus = {
  AUTHORIZED: 1,
  PROVISIONAL: 2,
  DENIED: 0,
  NOT_DETERMINED: -1,
};

export default messaging;
