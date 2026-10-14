/* eslint-env jest */
import AsyncStorage from '@react-native-async-storage/async-storage';
import locationService, {validateAddress} from '../services/locationService';
import api from '../utils/api';
import {check, request, RESULTS} from 'react-native-permissions';
import Geolocation from 'react-native-geolocation-service';
import authReducer, {
  completeAuthentication,
  setDeliveryAddress,
  actionLogout,
} from '../redux/reducers/auth';

jest.mock('../utils/api', () => ({
  __esModule: true,
  default: {post: jest.fn()},
}));

const fields = {
  name: 'Test Customer',
  contact: '9876543210',
  doorNo: '301, Test Building',
  pincode: '533101',
  landmark: '',
  type: 'Home',
  customType: '',
};
const place = {
  latitude: 17.0005,
  longitude: 81.804,
  area: 'Selected area',
  fullAddress: 'Selected street',
  city: 'Rajahmundry',
  state: 'Andhra Pradesh',
};
const feature = {
  geometry: {coordinates: [81.804, 17.0005]},
  properties: {
    osm_type: 'W',
    osm_id: 42,
    name: '6th Street',
    district: 'Danavaipeta',
    city: 'Rajamahendravaram',
    state: 'Andhra Pradesh',
    postcode: '533101',
    country: 'India',
  },
};
const originalFetch = global.fetch;
beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});
afterEach(() => {
  global.fetch = originalFetch;
});

test('invalid address details do not save locally or call the backend', async () => {
  await expect(
    locationService.saveAddress(42, {...fields, pincode: '123'}, place),
  ).rejects.toThrow('6-digit');
  await expect(
    locationService.saveAddress(42, fields, {...place, latitude: NaN}),
  ).rejects.toThrow('map first');
  expect(await locationService.getSavedAddresses(42)).toEqual([]);
  expect(api.post).not.toHaveBeenCalled();
});

test('custom address types require a label and landmark is optional', () => {
  expect(validateAddress({...fields, type: 'Others'}, place)).toMatch('label');
  expect(
    validateAddress({...fields, type: 'Others', customType: 'Parents'}, place),
  ).toBe('');
});

test('saving records the exact selected coordinates locally without a service-area or address API', async () => {
  const saved = await locationService.saveAddress(42, fields, place);
  expect(saved).toMatchObject({
    storage: 'local',
    customer_id: 42,
    location_id: null,
    customer_latitude: '17.0005',
    customer_longitude: '81.804',
    full_address: '301, Test Building, Selected street',
    door_no: '301, Test Building',
    street_address: 'Selected street',
  });
  expect(saved.id).toMatch(/^local-/);
  expect(await locationService.getSavedAddresses(42)).toEqual([saved]);
  expect(api.post).not.toHaveBeenCalled();
});

test('editing a saved address updates its record instead of creating duplicates', async () => {
  const saved = await locationService.saveAddress(42, fields, place);
  const edited = await locationService.saveAddress(
    42,
    {...fields, doorNo: '302'},
    place,
    saved.id,
  );
  expect(edited.id).toBe(saved.id);
  expect(await locationService.getSavedAddresses(42)).toEqual([edited]);
});

test('simultaneous local saves preserve both records', async () => {
  const saved = await Promise.all([
    locationService.saveAddress(42, fields, place),
    locationService.saveAddress(42, {...fields, type: 'Office'}, place),
  ]);
  expect(await locationService.getSavedAddresses(42)).toHaveLength(2);
  expect(new Set(saved.map(address => address.id)).size).toBe(2);
});

test('local storage failures are surfaced so the screen cannot claim an address was saved', async () => {
  AsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage unavailable'));
  await expect(locationService.saveAddress(42, fields, place)).rejects.toThrow(
    'Storage unavailable',
  );
  expect(await locationService.getSavedAddresses(42)).toEqual([]);
});

test('saved addresses can be deleted and remain separate between customers', async () => {
  const saved = await locationService.saveAddress(42, fields, place);
  expect(await locationService.getSavedAddresses(43)).toEqual([]);
  await locationService.deleteSavedAddress(42, saved.id);
  expect(await locationService.getSavedAddresses(42)).toEqual([]);
  expect(api.post).not.toHaveBeenCalled();
});

test('local saving is also usable without an API-backed customer session', async () => {
  const saved = await locationService.saveAddress(null, fields, place);
  expect(saved.customer_id).toBeNull();
  expect(await locationService.getSavedAddresses(null)).toEqual([saved]);
  expect(await locationService.getSavedAddresses(42)).toEqual([]);
});

test('blocked location permissions do not call GPS or repeatedly prompt', async () => {
  check.mockResolvedValue(RESULTS.BLOCKED);
  await expect(locationService.getCurrentLocation()).rejects.toThrow(
    'manually',
  );
  expect(request).not.toHaveBeenCalled();
  expect(Geolocation.getCurrentPosition).not.toHaveBeenCalled();
});

test('coordinates from the device are returned after permission is granted', async () => {
  check.mockResolvedValue(RESULTS.DENIED);
  request.mockResolvedValue(RESULTS.GRANTED);
  Geolocation.getCurrentPosition.mockImplementation(success =>
    success({coords: {latitude: 17, longitude: 81, accuracy: 10}}),
  );
  await expect(locationService.getCurrentLocation()).resolves.toEqual({
    latitude: 17,
    longitude: 81,
  });
});

test('free reverse geocoding fills the address while retaining the exact pin coordinates', async () => {
  global.fetch = jest
    .fn()
    .mockResolvedValue({ok: true, json: async () => ({features: [feature]})});
  await expect(locationService.reverseGeocode(place)).resolves.toMatchObject({
    latitude: 17.0005,
    longitude: 81.804,
    area: 'Danavaipeta',
    pincode: '533101',
  });
  expect(global.fetch).toHaveBeenCalledWith(
    expect.stringContaining('photon.komoot.io/reverse/'),
    expect.objectContaining({
      headers: expect.objectContaining({
        'User-Agent': expect.stringContaining('Amaraa'),
      }),
    }),
  );
});

test('free search results contain ready-to-select coordinates and are cached', async () => {
  global.fetch = jest
    .fn()
    .mockResolvedValue({ok: true, json: async () => ({features: [feature]})});
  const first = await locationService.searchPlaces('Rajahmundry', place);
  const second = await locationService.searchPlaces('Rajahmundry', place);
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(first).toEqual(second);
  expect(first[0].description).toContain('6th Street');
  expect(await locationService.getPlace(first[0])).toMatchObject({
    latitude: 17.0005,
    longitude: 81.804,
  });
  expect(global.fetch).toHaveBeenCalledTimes(1);
});

test('short queries and cancelled searches do not contact the free geocoder', async () => {
  global.fetch = jest.fn();
  expect(await locationService.searchPlaces('Ra', place)).toEqual([]);
  const controller = new AbortController();
  controller.abort();
  await expect(
    locationService.searchPlaces('Cancelled search', place, controller.signal),
  ).rejects.toThrow('cancelled');
  expect(global.fetch).not.toHaveBeenCalled();
});

test('delivery state clears when the selected address is deleted, on logout, or for a new customer', () => {
  const saved = {
    customer_latitude: '17',
    customer_longitude: '81',
    location_id: null,
    location_name: 'Delivery area',
  };
  const state = authReducer(
    authReducer(undefined, {type: 'init'}),
    setDeliveryAddress(saved),
  );
  expect(state).toMatchObject({
    deliveryAddress: saved,
    location: {latitude: 17, longitude: 81},
  });
  expect(authReducer(state, setDeliveryAddress(null))).toMatchObject({
    deliveryAddress: null,
    location: null,
    locationId: null,
  });
  expect(
    authReducer(state, completeAuthentication({customerId: 43}))
      .deliveryAddress,
  ).toBeNull();
  expect(authReducer(state, actionLogout()).deliveryAddress).toBeNull();
});
