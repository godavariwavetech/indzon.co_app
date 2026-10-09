import { getCreatedOrder, getOrderId, getPlacementOutcome } from '../src/utils/orderResponse';

test.each([
  [{ status: 200, message: 'Order placed' }, 'success'],
  [{ success: true }, 'success'],
  [{ id: 42 }, 'success'],
  [{ status: 400, id: 42 }, 'failed'],
  [{ success: false, message: 'Unavailable' }, 'failed'],
  [{ status: 'failed' }, 'failed'],
  [{ message: 'Unexpected response' }, 'unknown'],
])('classifies placement response %j as %s', (response, outcome) => {
  expect(getPlacementOutcome(response)).toBe(outcome);
});

describe('created order navigation data', () => {
  test.each([
    [{ id: 42, order_id: 'AM42' }, 42],
    [{ order_id: 42 }, 42],
    [{ data: { id: 42 } }, 42],
    [{ data: [{ id: 42 }] }, 42],
    [undefined, undefined],
    [{ data: [] }, undefined],
    ['Order failed', undefined],
  ])('resolves the lookup ID from %j', (response, expected) => {
    expect(getOrderId(response)).toBe(expected);
  });

  test('preserves the created order fields when unwrapping', () => {
    const order = { id: 42, order_id: 'AM42', grand_total: 350 };
    expect(getCreatedOrder({ data: [order] })).toEqual(order);
  });
});
