import axios from 'axios';
import {baseURL} from '../config/config';
import {store} from '../redux/store';
import {STATIC_APP_FLOW} from '../config/appMode';

const api = axios.create({
  baseURL,
  timeout: 10000,
});

api.interceptors.request.use(
  config => {
    // Prevent any dormant backend action from sending requests in static mode.
    if (STATIC_APP_FLOW) {
      throw new Error('API calls are disabled while the app uses static data.');
    }
    const fullUrl = `${config.baseURL || ''}${config.url}`;
    // console.log(`[API REQUEST] ${config.method?.toUpperCase()} ${fullUrl}`, {
    //   params: config.params,
    //   data: config.data,
    // });
    try {
      const state = store.getState();
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
