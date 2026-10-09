import { getCreatedOrder, getOrderId, getPlacementOutcome, getOrderRecords, findOrderInResponse, getPlacementErrorTitle, getPlacementErrorMessage } from '../src/utils/orderResponse';

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

describe('order lookup responses', () => {
  const olderOrder = { id: 41, order_id: 'AM41' };
  const placedOrder = { id: 42, order_id: 'AM42' };

  test.each([
    [{ data: [olderOrder, placedOrder] }],
    [[olderOrder, placedOrder]],
    [{ data: placedOrder }],
    [placedOrder],
  ])('finds the placed order rather than assuming the first record in %j', response => {
    expect(findOrderInResponse(response, placedOrder)).toEqual(placedOrder);
  });

  test('resolves a public placement number to the database order', () => {
    expect(findOrderInResponse({ data: [olderOrder, placedOrder] }, { order_id: 'AM42' }))
      .toEqual(placedOrder);
  });

  test('matches database IDs returned as strings', () => {
    expect(findOrderInResponse({ data: [placedOrder] }, { id: '42' })).toEqual(placedOrder);
  });

  test('accepts placement responses that use order_id for the database ID', () => {
    expect(findOrderInResponse({ data: [placedOrder] }, { order_id: 42 })).toEqual(placedOrder);
  });

  test('does not display an unrelated order when the placed order is missing', () => {
    expect(findOrderInResponse({ data: [olderOrder] }, placedOrder)).toBeUndefined();
    expect(findOrderInResponse({ data: [olderOrder] }, {})).toBeUndefined();
  });

  test('distinguishes empty history from an invalid response', () => {
    expect(getOrderRecords({ data: [] })).toEqual([]);
    expect(getOrderRecords({ status: 200, message: 'OK' })).toBeNull();
  });
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

describe('COD timing errors', () => {
  test.each([400, '400'])('shows Timing Error for backend status %s', status => {
    const response = { status };
    expect(getPlacementErrorTitle(response)).toBe('Timing Error');
    expect(getPlacementErrorMessage(response)).toContain('timing issue');
    expect(getPlacementOutcome(response)).toBe('failed');
  });

  test('keeps the backend timing explanation when available', () => {
    expect(getPlacementErrorMessage({ status: 400, message: 'Ordering window closed' }))
      .toBe('Ordering window closed');
  });

  test('keeps other failures separate from timing errors', () => {
    expect(getPlacementErrorTitle({ status: 500 })).toBe('Order Failed');
    expect(getPlacementErrorMessage({ status: 500 })).not.toContain('timing issue');
  });
});
