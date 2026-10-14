import React from 'react';
import {act, create} from 'react-test-renderer';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import authReducer from '../redux/reducers/auth';

// Use the installed renderer and a non-persisted auth store.
// Tests may inject a store with additional reducers.
export function renderWithProviders(
  ui: React.ReactElement,
  {store = configureStore({reducer: {Auth: authReducer}})} = {},
) {
  let renderer!: ReturnType<typeof create>;
  act(() => {
    renderer = create(<Provider store={store}>{ui}</Provider>);
  });
  return {store, renderer};
}
