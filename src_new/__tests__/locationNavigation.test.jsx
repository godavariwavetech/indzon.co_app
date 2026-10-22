/* eslint-env jest */
import React from 'react';
import {act, create} from 'react-test-renderer';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import AppNavigation from '../navigation/AppNavigation';
import authReducer, {
  completeAuthentication,
  setDeliveryAddress,
} from '../redux/reducers/auth';

jest.mock('../navigation/RentalNavigation', () => 'RentalNavigation');
jest.mock('../../src/navigation/RentalNavigation', () => 'HomeNavigation');
jest.mock('../screens/location/AddAddressScreen', () => 'AddAddressScreen');
jest.mock('../utils/api', () => ({
  __esModule: true,
  default: {post: jest.fn()},
}));

const renderers = [];
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
});
afterEach(() =>
  act(() => renderers.splice(0).forEach(renderer => renderer.unmount())),
);

async function renderNavigation(address, session = {}) {
  const store = configureStore({reducer: {Auth: authReducer}});
  store.dispatch(
    completeAuthentication({
      customerId: 42,
      mobileNumber: '9876543210',
      ...session,
    }),
  );
  if (address) {
    store.dispatch(setDeliveryAddress(address));
  }
  let renderer;
  await act(async () => {
    renderer = create(
      <Provider store={store}>
        <AppNavigation />
      </Provider>,
    );
  });
  renderers.push(renderer);
  return {renderer, store};
}

test('verified customers without a saved delivery address enter the location flow', async () => {
  const {renderer} = await renderNavigation();
  const props = renderer.root.findByType('RentalNavigation').props;
  expect(props.initialRouteName).toBe('NamePrompt');
  expect(props.routes.map(route => route.name)).toEqual(
    expect.arrayContaining(['NamePrompt', 'LocationSetup', 'AddAddress', 'Home']),
  );
});

test('returning customers with a saved delivery address start at Home', async () => {
  const {renderer} = await renderNavigation({
    customer_latitude: '17',
    customer_longitude: '81',
    location_id: 7,
  });
  expect(
    renderer.root.findByType('RentalNavigation').props.initialRouteName,
  ).toBe('Home');
});

test('a new verified customer cannot inherit the previous delivery address', async () => {
  const {renderer, store} = await renderNavigation({
    customer_latitude: '17',
    customer_longitude: '81',
    location_id: 7,
  });
  await act(async () => {
    store.dispatch(completeAuthentication({customerId: 43}));
  });
  expect(
    renderer.root.findByType('RentalNavigation').props.initialRouteName,
  ).toBe('NamePrompt');
});

test('customers who already have a name go straight to the location screen', async () => {
  const {renderer} = await renderNavigation(undefined, {customerName: 'Asha'});
  expect(
    renderer.root.findByType('RentalNavigation').props.initialRouteName,
  ).toBe('LocationSetup');
});
