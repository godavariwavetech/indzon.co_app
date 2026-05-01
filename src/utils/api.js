import axios from "axios";
import { baseURL } from "../config/config";
import { store } from "../redux/store";

const api = axios.create({
  baseURL,
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const fullUrl = `${config.baseURL || ''}${config.url}`;
    // console.log(`[API REQUEST] ${config.method?.toUpperCase()} ${fullUrl}`, {
    //   params: config.params,
    //   data: config.data,
    // });
    try {
      const state = store.getState();
      const token = state.Auth?.token;

      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error retrieving auth token from Redux:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
