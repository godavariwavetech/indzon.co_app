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

// Keep static UI state separate from the persisted customer session and cart.
// Static OTP navigation never marks this store as authenticated.
export const staticStore = configureStore({
  reducer: {
    Auth: AuthSlice,
    Dashboard,
    address: addressReducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;
export type RootState = ReturnType<typeof store.getState>;
