/* eslint-env jest */
import {createLiveItemCache} from '../services/liveItemCache';
import {verifyCartPrices} from '../services/cartPrices';

const id = 'z_grocery_item_lst_t:1';
const product = price => ({id, price, originalPrice: 150, gstPercent: 5, shopId: '1'});

test('refresh replaces cached prices and notifies both cart and footer consumers', async () => {
  const load = jest.fn().mockResolvedValueOnce(product(100)).mockResolvedValueOnce(product(120));
  const cache = createLiveItemCache(load);
  const cart = Object.freeze({[id]: 2});
  const cartListener = jest.fn(), footerListener = jest.fn();
  cache.subscribe(cartListener);
  cache.subscribe(footerListener);
  await cache.refresh(Object.keys(cart), 1);
  await cache.refresh(Object.keys(cart), 1);
  expect(cache.get(id, 1).price * cart[id]).toBe(240);
  expect(cartListener).toHaveBeenCalledTimes(2);
  expect(footerListener).toHaveBeenCalledTimes(2);
  expect(cart[id]).toBe(2);
});

test('concurrent consumers share a request, and delivery areas have separate snapshots', async () => {
  const load = jest.fn().mockResolvedValue(product(100));
  const cache = createLiveItemCache(load);
  await Promise.all([cache.refresh([id], 1), cache.refresh([id], 1)]);
  expect(load).toHaveBeenCalledTimes(1);
  await cache.refresh([id], 2);
  expect(load).toHaveBeenCalledTimes(2);
});

test('checkout stops on a changed price after publishing the latest price', async () => {
  const load = jest.fn().mockResolvedValue(product(120));
  const cache = createLiveItemCache(load);
  await expect(verifyCartPrices({ids: [id], previous: {[id]: product(100)},
    locationId: 1, refresh: cache.refresh})).rejects.toThrow('prices have changed');
  expect(cache.get(id, 1).price).toBe(120);
  await expect(verifyCartPrices({ids: [id], previous: {[id]: product(120)},
    locationId: 1, refresh: cache.refresh})).resolves.toBeUndefined();
});

test('checkout blocks unavailable items and network failures without accepting old prices', async () => {
  const refresh = jest.fn().mockResolvedValue({[id]: null});
  const args = {ids: [id], previous: {[id]: product(100)}, locationId: 1, refresh};
  await expect(verifyCartPrices(args)).rejects.toThrow('could not be verified');
  refresh.mockRejectedValue(new Error('Network error'));
  await expect(verifyCartPrices(args)).rejects.toThrow('Network error');
  expect(args.previous[id].price).toBe(100);
});
