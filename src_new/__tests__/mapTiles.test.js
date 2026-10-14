/* eslint-env jest */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getMapTile, tileUrl} from '../services/mapTiles';

const originalFetch = global.fetch;
const originalReader = global.FileReader;
beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  global.FileReader = class {
    readAsDataURL() {
      this.result = 'data:image/png;base64,test';
      this.onload();
    }
  };
});
afterEach(() => {
  global.fetch = originalFetch;
  global.FileReader = originalReader;
});

test('visible tile requests are identified, cached and deduplicated', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    blob: async () => ({}),
    headers: {get: () => 'public, max-age=604800'},
  });
  const tile = {z: 17, x: 95361, y: 59254};
  const results = await Promise.all([getMapTile(tile), getMapTile(tile)]);
  expect(results).toEqual([
    'data:image/png;base64,test',
    'data:image/png;base64,test',
  ]);
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(global.fetch).toHaveBeenCalledWith(
    tileUrl(tile),
    expect.objectContaining({
      headers: {'User-Agent': expect.stringContaining('Amaraa')},
    }),
  );
  await getMapTile(tile);
  expect(global.fetch).toHaveBeenCalledTimes(1);
  const stored = JSON.parse(
    await AsyncStorage.getItem(`amaraa-map-tile:${tileUrl(tile)}`),
  );
  expect(stored.expiresAt).toBeGreaterThan(
    Date.now() + 6 * 24 * 60 * 60 * 1000,
  );
});
test('a persisted tile can be revisited without a network request', async () => {
  const tile = {z: 17, x: 95362, y: 59254};
  await AsyncStorage.setItem(
    `amaraa-map-tile:${tileUrl(tile)}`,
    JSON.stringify({
      dataUri: 'data:image/png;base64,cached',
      expiresAt: Date.now() + 60000,
    }),
  );
  global.fetch = jest.fn();
  expect(await getMapTile(tile)).toBe('data:image/png;base64,cached');
  expect(global.fetch).not.toHaveBeenCalled();
});
test('a failed tile response surfaces a retryable error instead of a cached success', async () => {
  global.fetch = jest.fn().mockResolvedValue({ok: false});
  await expect(getMapTile({z: 17, x: 95363, y: 59254})).rejects.toThrow(
    'retry',
  );
});
