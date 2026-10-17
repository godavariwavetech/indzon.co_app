// react-native-geolocation-service -> the browser Geolocation API.
const geo = () =>
  typeof navigator !== 'undefined' ? navigator.geolocation : null;

export default {
  getCurrentPosition(success, error, options) {
    const api = geo();
    if (!api) {
      error?.({code: 2, message: 'Location is not available in this browser.'});
      return;
    }
    api.getCurrentPosition(success, error, options);
  },
  watchPosition(success, error, options) {
    return geo()?.watchPosition(success, error, options) ?? -1;
  },
  clearWatch(id) {
    geo()?.clearWatch(id);
  },
  stopObserving() {},
  requestAuthorization: async () => 'granted',
};
