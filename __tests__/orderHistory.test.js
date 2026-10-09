jest.mock('../src/utils/api', () => ({ post: jest.fn() }));
jest.mock('../metro.config', () => ({}));

import reducer, { getOrders } from '../src/redux/reducers/daddy';

describe('order history cache', () => {
  const history = [{ id: 1 }, { id: 2 }];

  test('stores the complete history response', () => {
    const state = reducer(undefined, getOrders.fulfilled(
      { data: history }, 'history-request', { orderId: 0 },
    ));
    expect(state.orders).toEqual(history);
  });

  test('opening an order does not replace the history', () => {
    const initial = reducer(undefined, getOrders.fulfilled(
      { data: history }, 'history-request', { orderId: 0 },
    ));
    const state = reducer(initial, getOrders.fulfilled(
      { data: [{ id: 2 }] }, 'detail-request', { orderId: 2 },
    ));
    expect(state.orders).toEqual(history);
  });

  test('a failed refresh preserves previously loaded orders', () => {
    const initial = reducer(undefined, getOrders.fulfilled(
      { data: history }, 'history-request', { orderId: 0 },
    ));
    const state = reducer(initial, getOrders.rejected(
      new Error('Network unavailable'), 'refresh-request', { orderId: 0 },
    ));
    expect(state.orders).toEqual(history);
  });
});
