import {configureStore} from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';

import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthSlice from './reducers/auth';
import userDahboard from './reducers/userDashboard';
import Dashboard from './reducers/daddy';
import couponsReducer from './reducers/coupons';
import addressReducer from './reducers/addressSlice';
import search from './reducers/search';
import commerce from './reducers/commerce';
// Import the coupons reducer
// import { AuthSlice } from './reducers/auth';
// import Auth from './reducers/auth';
const persistConfig = {
  key: 'amaraa-new-auth',
  storage: AsyncStorage,
};
const persistedAuth = persistReducer(persistConfig, AuthSlice);

const dashboardPersistConfig = {
  key: 'amaraa-new-dashboardCart',
  storage: AsyncStorage,
  whitelist: [
    'cartItems',
    'cartRestaurant',
    'totalPrice',
    'categories',
    'banners',
    'homeRestaurnats',
  ],
};

export const store = configureStore({
  reducer: {
    Auth: persistedAuth,
    userDahboard,
    Dashboard: persistReducer(dashboardPersistConfig, Dashboard),
    coupons: couponsReducer,
    address: addressReducer,
    search,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistorStore = persistStore(store);

// Persists both the static preview login and, once ENABLE_LIVE_DATA is on, the
// real backend session (token/customerId/isLogged) so it survives app restarts.
const staticAuthPersistConfig = {
  key: 'amaraa-static-login',
  storage: AsyncStorage,
  whitelist: [
    'previewLoginComplete',
    'mobileNumber',
    'deliveryAddress',
    'location',
    'locationName',
    'locationId',
    'token',
    'customerId',
    'customerName',
    'isLogged',
    'profileData',
  ],
};
export const staticStore = configureStore({
  reducer: {
    commerce,
    Auth: persistReducer(staticAuthPersistConfig, AuthSlice),
    Dashboard,
    address: addressReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});
export const staticPersistor = persistStore(staticStore);

export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;
export type RootState = ReturnType<typeof store.getState>;
