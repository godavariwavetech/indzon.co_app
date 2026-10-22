/* eslint-env jest */
import React from 'react';
import {act, create} from 'react-test-renderer';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import LocationSetupScreen from '../screens/location/LocationSetupScreen';
import AddAddressScreen from '../screens/location/AddAddressScreen';
import AddressDetailsSheet from '../components/location/AddressDetailsSheet';
import AddressListScreen from '../screens/location/AddressListScreen';
import locationService from '../services/locationService';
import authReducer from '../redux/reducers/auth';
import dashboardReducer from '../redux/reducers/daddy';
import addressReducer from '../redux/reducers/addressSlice';

jest.mock('../utils/api', () => ({
  __esModule: true,
  default: {post: jest.fn()},
}));
jest.mock('../services/locationService', () => ({
  ...jest.requireActual('../services/locationService'),
  __esModule: true,
  default: {
    getCurrentLocation: jest.fn(),
    reverseGeocode: jest.fn(),
    searchPlaces: jest.fn(),
    getPlace: jest.fn(),
    saveAddress: jest.fn(),
    getSavedAddresses: jest.fn(),
    deleteSavedAddress: jest.fn(),
  },
}));
jest.mock('../components/location/FreeMap', () => ({
  __esModule: true,
  default: 'FreeMap',
}));
jest.mock('react-native-vector-icons/MaterialIcons', () => 'MaterialIcon');
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useFocusEffect: callback => require('react').useEffect(callback, [callback]),
  useIsFocused: () => true,
}));

const renderers = [];
const place = {
  latitude: 17,
  longitude: 81,
  area: 'Selected area',
  fullAddress: 'Selected street',
  pincode: '533101',
};
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks();
  locationService.reverseGeocode.mockResolvedValue(place);
  locationService.getSavedAddresses.mockResolvedValue([]);
});
afterEach(() =>
  act(() => renderers.splice(0).forEach(renderer => renderer.unmount())),
);

async function renderScreen(Component, props = {}) {
  const store = configureStore({
    reducer: {
      Auth: authReducer,
      Dashboard: dashboardReducer,
      address: addressReducer,
    },
  });
  const navigation = {navigate: jest.fn(), goBack: jest.fn(), reset: jest.fn()};
  let renderer;
  await act(async () => {
    renderer = create(
      <Provider store={store}>
        <Component
          navigation={navigation}
          route={{params: {onboarding: true}}}
          {...props}
        />
      </Provider>,
    );
  });
  renderers.push(renderer);
  return {renderer, store, navigation};
}

test('manual selection does not request device location permission', async () => {
  const {renderer, navigation} = await renderScreen(LocationSetupScreen);
  act(() =>
    renderer.root.findByProps({testID: 'location-manual'}).props.onPress(),
  );
  expect(locationService.getCurrentLocation).not.toHaveBeenCalled();
  expect(navigation.navigate).toHaveBeenCalledWith('AddAddress', {
    onboarding: true,
  });
});

test('manual selection cancels a pending device location navigation', async () => {
  let resolveLocation;
  locationService.getCurrentLocation.mockImplementation(
    () =>
      new Promise(resolve => {
        resolveLocation = resolve;
      }),
  );
  const {renderer, navigation} = await renderScreen(LocationSetupScreen);
  let request;
  act(() => {
    request = renderer.root
      .findByProps({testID: 'location-device'})
      .props.onPress();
  });
  act(() =>
    renderer.root.findByProps({testID: 'location-manual'}).props.onPress(),
  );
  await act(async () => {
    resolveLocation({latitude: 17, longitude: 81});
    await request;
  });
  expect(navigation.navigate).toHaveBeenCalledTimes(1);
  expect(navigation.navigate).toHaveBeenCalledWith('AddAddress', {
    onboarding: true,
  });
});

test('a failed save keeps the details sheet open and does not select an address', async () => {
  locationService.saveAddress.mockRejectedValue(new Error('Save failed'));
  const {renderer, navigation, store} = await renderScreen(AddAddressScreen);
  const sheet = renderer.root.findByType(AddressDetailsSheet);
  act(() =>
    renderer.root.findByProps({testID: 'address-more-details'}).props.onPress(),
  );
  await expect(sheet.props.onSave({})).rejects.toThrow('Save failed');
  expect(sheet.props.visible).toBe(true);
  expect(store.getState().Auth.deliveryAddress).toBeNull();
  expect(navigation.reset).not.toHaveBeenCalled();
});

test('a confirmed save updates delivery state before opening Home', async () => {
  const saved = {
    id: 123,
    customer_latitude: '17',
    customer_longitude: '81',
    location_id: 7,
    location_name: 'Delivery area',
    full_address: 'Selected street',
  };
  locationService.saveAddress.mockResolvedValue(saved);
  const {renderer, store, navigation} = await renderScreen(AddAddressScreen);
  await act(async () => {
    await renderer.root.findByType(AddressDetailsSheet).props.onSave({});
  });
  expect(store.getState().Auth.deliveryAddress).toEqual(saved);
  expect(store.getState().Dashboard.userAddress).toEqual(saved);
  expect(store.getState().address.selectedAddress).toEqual(saved);
  expect(navigation.reset).toHaveBeenCalledWith({
    index: 0,
    routes: [{name: 'Home'}],
  });
});

test('a slow previous geocode response cannot replace a newer map selection', async () => {
  let resolveOld;
  locationService.reverseGeocode
    .mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveOld = resolve;
        }),
    )
    .mockResolvedValueOnce({...place, area: 'New area', latitude: 18});
  const {renderer} = await renderScreen(AddAddressScreen);
  await act(async () => {
    renderer.root
      .findByProps({testID: 'address-map'})
      .props.onRegionChangeComplete({...place, latitude: 18});
  });
  await act(async () => {
    resolveOld({...place, area: 'Old area'});
  });
  expect(renderer.root.findByType(AddressDetailsSheet).props.place.area).toBe(
    'New area',
  );
});

test('validation errors prevent submitting incomplete address details', async () => {
  const onSave = jest.fn();
  const {renderer} = await renderScreen(AddressDetailsSheet, {
    visible: true,
    place,
    phoneNumber: '9876543210',
    onSave,
    onClose: jest.fn(),
  });
  await act(async () => {
    await renderer.root.findByProps({testID: 'address-save'}).props.onPress();
  });
  expect(onSave).not.toHaveBeenCalled();
  expect(
    renderer.root.findByProps({testID: 'address-save-error'}).props.children,
  ).toBe('Enter your name.');
});

test('saved local addresses can be selected and edited from the address list', async () => {
  const saved = {
    id: 'local-123',
    storage: 'local',
    address_type: 'Home',
    customer_latitude: '17',
    customer_longitude: '81',
    location_id: null,
    full_address: 'Selected street',
  };
  locationService.getSavedAddresses.mockResolvedValue([saved]);
  const {renderer, store, navigation} = await renderScreen(AddressListScreen);
  act(() =>
    renderer.root
      .findByProps({accessibilityLabel: 'Use Home address'})
      .props.onPress(),
  );
  expect(store.getState().Auth.deliveryAddress).toEqual(saved);
  expect(navigation.goBack).toHaveBeenCalled();
  act(() =>
    renderer.root
      .findByProps({accessibilityLabel: 'Edit Home address'})
      .props.onPress(),
  );
  expect(navigation.navigate).toHaveBeenCalledWith('AddAddress', {
    address: saved,
  });
});

test('editing local address details uses the saved street without a new geocoder request', async () => {
  const saved = {
    id: 'local-123',
    storage: 'local',
    address_type: 'Home',
    customer_latitude: '17',
    customer_longitude: '81',
    location_name: 'Selected area',
    street_address: 'Selected street',
    door_no: '301',
    pincode: '533101',
  };
  const {renderer} = await renderScreen(AddAddressScreen, {
    route: {params: {address: saved}},
  });
  expect(locationService.reverseGeocode).not.toHaveBeenCalled();
  expect(
    renderer.root.findByType(AddressDetailsSheet).props.place,
  ).toMatchObject({
    fullAddress: 'Selected street',
    latitude: 17,
    longitude: 81,
  });
  expect(
    renderer.root.findByProps({testID: 'address-more-details'}).props.disabled,
  ).toBe(false);
});

test('the current-location control moves the free map to device coordinates', async () => {
  locationService.getCurrentLocation.mockResolvedValue({
    latitude: 18,
    longitude: 82,
  });
  locationService.reverseGeocode.mockResolvedValue({
    ...place,
    latitude: 18,
    longitude: 82,
  });
  const {renderer} = await renderScreen(AddAddressScreen);
  await act(async () => {
    await renderer.root.findByProps({testID: 'address-map'}).props.onLocate();
  });
  expect(
    renderer.root.findByProps({testID: 'address-map'}).props.center,
  ).toMatchObject({latitude: 18, longitude: 82});
  expect(
    renderer.root.findByType(AddressDetailsSheet).props.place,
  ).toMatchObject({latitude: 18, longitude: 82});
});
