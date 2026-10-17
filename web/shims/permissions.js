// Browser stand-in for react-native-permissions. The browser shows its own
// prompt when a feature (e.g. geolocation) is used, so everything reports
// "granted" here.
const names = new Proxy({}, {get: (_, key) => String(key)});
export const PERMISSIONS = {ANDROID: names, IOS: names};
export const RESULTS = {
  UNAVAILABLE: 'unavailable',
  DENIED: 'denied',
  LIMITED: 'limited',
  GRANTED: 'granted',
  BLOCKED: 'blocked',
};
export const check = async () => RESULTS.GRANTED;
export const request = async () => RESULTS.GRANTED;
export const checkNotifications = async () => ({
  status: RESULTS.GRANTED,
  settings: {},
});
export const requestNotifications = async () => ({
  status: RESULTS.GRANTED,
  settings: {},
});
export const openSettings = async () => {};
export default {
  PERMISSIONS,
  RESULTS,
  check,
  request,
  checkNotifications,
  requestNotifications,
  openSettings,
};
