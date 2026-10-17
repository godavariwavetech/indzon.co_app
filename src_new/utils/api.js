import axios from 'axios';
import {baseURL} from '../config/config';
import {store, staticStore} from '../redux/store';
import {STATIC_APP_FLOW, ENABLE_LIVE_DATA} from '../config/appMode';

const api = axios.create({
  baseURL,
  timeout: 10000,
});

api.interceptors.request.use(
  config => {
    // ENABLE_LIVE_DATA (not STATIC_APP_FLOW) is the real network kill-switch —
    // STATIC_APP_FLOW only picks the navigator/store, and src_new keeps using
    // staticStore even once ENABLE_LIVE_DATA is true.
    if (!ENABLE_LIVE_DATA) {
      throw new Error('API calls are disabled while the app uses static data.');
    }
    const fullUrl = `${config.baseURL || ''}${config.url}`;
    // console.log(`[API REQUEST] ${config.method?.toUpperCase()} ${fullUrl}`, {
    //   params: config.params,
    //   data: config.data,
    // });
    try {
      // The app actually runs on staticStore while STATIC_APP_FLOW is true —
      // reading the token from `store` here would always see an empty session.
      const activeStore = STATIC_APP_FLOW ? staticStore : store;
      const state = activeStore.getState();
      const token = state.Auth?.token;

      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error retrieving auth token from Redux:', error);
    }
    return config;
  },
  error => Promise.reject(error),
);

export default api;
