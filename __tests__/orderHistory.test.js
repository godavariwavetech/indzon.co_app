/**
 * @jest-environment-options {"customExportConditions": ["node", "node-addons"]}
 */
jest.mock('../src/utils/api', () => ({ post: jest.fn() }));
jest.mock('../metro.config', () => ({}));

import reducer, { getOrders, placeOrder } from '../src/redux/reducers/daddy';
import api from '../src/utils/api';

describe('placement HTTP failures', () => {
  test('preserves HTTP 400 timing errors for the COD alert', async () => {
    api.post.mockRejectedValueOnce({
      response: { status: 400, data: { message: 'Ordering window closed' } },
    });
    const action = await placeOrder({ orderDetails: {} })(jest.fn(), jest.fn(), undefined);
    expect(placeOrder.rejected.match(action)).toBe(true);
    expect(action.payload).toEqual({ status: 400, message: 'Ordering window closed' });
  });

  test('does not classify an unknown network failure as a timing error', async () => {
    api.post.mockRejectedValueOnce(new Error('Network unavailable'));
    const action = await placeOrder({ orderDetails: {} })(jest.fn(), jest.fn(), undefined);
    expect(placeOrder.rejected.match(action)).toBe(true);
    expect(action.payload).toBeUndefined();
  });
});

describe('order history API response handling', () => {
  const history = [{ id: 41 }, { id: 42 }];

  test.each([
    [{ data: history }],
    [history],
    [{ data: history[1] }],
  ])('normalizes the server response %j', async body => {
    api.post.mockResolvedValueOnce({ data: body });
    const action = await getOrders({ orderId: 0 })(
      jest.fn(), () => ({ Auth: { customerId: 7 } }), undefined,
    );
    expect(getOrders.fulfilled.match(action)).toBe(true);
    expect(action.payload.data).toEqual(Array.isArray(body) ? history :
      Array.isArray(body.data) ? history : [history[1]]);
    expect(api.post).toHaveBeenLastCalledWith(expect.any(String), {
      customer_id: 7, order_id: 0,
    });
  });

  test.each([
    [{ status: 200, message: 'Unexpected format' }],
    [{ status: 'failed', data: history }],
  ])('rejects an invalid history response without clearing cached orders', async body => {
    const initial = reducer(undefined, getOrders.fulfilled(
      { data: history }, 'previous-history', { orderId: 0 },
    ));
    api.post.mockResolvedValueOnce({ data: body });
    const action = await getOrders({ orderId: 0 })(
      jest.fn(), () => ({ Auth: { customerId: 7 } }), undefined,
    );
    expect(getOrders.rejected.match(action)).toBe(true);
    expect(reducer(initial, action).orders).toEqual(history);
  });
});

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
