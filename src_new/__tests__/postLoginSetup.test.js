/* eslint-env jest */
import AsyncStorage from '@react-native-async-storage/async-storage';
import locationService, {distanceKm} from '../services/locationService';
import api from '../utils/api';

jest.mock('../utils/api', () => ({
  __esModule: true,
  default: {post: jest.fn(), get: jest.fn()},
}));

const customer = {customerId: 7, name: 'Asha', mobileNumber: '9876543210'};
const area = {id: 1, name: 'rajahmundry'};
const here = {latitude: 17.0, longitude: 81.78};

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

test('a saved address inside the serviceable area is selected, nearest first', async () => {
  api.post.mockResolvedValue({
    data: {
      data: [
        {id: 1, location_id: 1, customer_latitude: '17.20', customer_longitude: '81.78'},
        {id: 2, location_id: 1, customer_latitude: '17.001', customer_longitude: '81.781'},
        {id: 3, location_id: 9, customer_latitude: '17.0', customer_longitude: '81.78'},
      ],
    },
  });
  const result = await locationService.pickAddressForArea({
    customer,
    coordinates: here,
    area,
  });
  expect(result.source).toBe('saved');
  expect(result.address.id).toBe(2);
});

test('choosing a service area builds an address from the area when nothing is saved there', async () => {
  api.post.mockResolvedValue({data: {data: []}});
  const result = await locationService.pickAddressForArea({
    customer,
    coordinates: {latitude: 17.0044, longitude: 81.7833},
    area,
    label: 'rajahmundry',
  });
  expect(result.source).toBe('area');
  expect(result.address).toMatchObject({
    full_address: 'rajahmundry',
    location_id: 1,
    location_name: 'rajahmundry',
    customer_name: 'Asha',
    customer_mobile_number: '9876543210',
    customer_latitude: '17.0044',
    customer_longitude: '81.7833',
  });
});

test('a failing address lookup still lets the user continue with the area address', async () => {
  api.post.mockRejectedValue(new Error('offline'));
  const result = await locationService.pickAddressForArea({
    customer,
    coordinates: here,
    area,
    label: 'rajahmundry',
  });
  expect(result.source).toBe('area');
});

test('service area lookups read the coordinates the backend expects', async () => {
  api.post.mockResolvedValue({
    data: {data: {available_locations: [{id: '1', location_name: 'rajahmundry'}]}},
  });
  await expect(locationService.findServiceArea(here)).resolves.toEqual({
    id: 1,
    name: 'rajahmundry',
  });
  expect(api.post.mock.calls[0][1]).toEqual({
    location_latitude: 17.0,
    location_longitude: 81.78,
  });
  api.post.mockResolvedValue({
    data: {data: {service_available: false, available_locations: []}},
  });
  await expect(locationService.findServiceArea(here)).resolves.toBeNull();
});

test('the list of serviceable areas drops entries without a usable position', async () => {
  api.get.mockResolvedValue({
    data: {
      data: [
        {id: 1, location_name: 'rajahmundry', location_latitude: '17.0044', location_longitude: '81.7833'},
        {id: 2, location_name: 'broken', location_latitude: 'x', location_longitude: '81'},
      ],
    },
  });
  await expect(locationService.getServiceAreas()).resolves.toEqual([
    {id: 1, name: 'rajahmundry', latitude: 17.0044, longitude: 81.7833},
  ]);
});

test('distance is roughly right', () => {
  expect(distanceKm(here, here)).toBe(0);
  expect(distanceKm(here, {latitude: 17.1, longitude: 81.78})).toBeGreaterThan(10);
  expect(distanceKm(here, {latitude: 17.1, longitude: 81.78})).toBeLessThan(12);
});
