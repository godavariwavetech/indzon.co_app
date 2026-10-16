/* eslint-env jest */
import {evaluateCoupon} from '../config/coupons';
import reducer, {
  setCouponCode,
  placePreviewOrder,
  resetCommerce,
} from '../redux/reducers/commerce';

const groceries = [{price: 400, quantity: 1, categoryId: 'grocery'}];
test('normalizes coupon input and caps a percentage offer at 100', () => {
  expect(evaluateCoupon(' mealup50 ', groceries)).toEqual({
    code: 'MEALUP50',
    discount: 100,
    error: null,
  });
});
test('flat discounts never exceed the eligible cart amount', () => {
  expect(evaluateCoupon('SUMMER25', [{price: 40, quantity: 1}]).discount).toBe(
    40,
  );
});
test('rejects invalid codes and empty carts', () => {
  expect(evaluateCoupon('INVALID', groceries).error).toBeTruthy();
  expect(evaluateCoupon('MEALUP50', []).error).toBeTruthy();
});
test('healthy discount only applies to eligible produce in a mixed cart', () => {
  expect(evaluateCoupon('HEALTHY20', groceries).discount).toBe(0);
  expect(
    evaluateCoupon('HEALTHY20', [
      ...groceries,
      {price: 100, quantity: 2, categoryId: 'produce'},
    ]).discount,
  ).toBe(40);
});
test('minimum quantity is checked again after the cart changes', () => {
  expect(evaluateCoupon('SNACK15', [{price: 100, quantity: 5}]).discount).toBe(
    75,
  );
  expect(evaluateCoupon('SNACK15', [{price: 100, quantity: 4}]).discount).toBe(
    0,
  );
});
test('first-order offer excludes customers with prior preview orders', () => {
  expect(evaluateCoupon('FIRSTORDER20', groceries).discount).toBe(80);
  expect(
    evaluateCoupon('FIRSTORDER20', groceries, [{id: 'previous'}]).error,
  ).toBeTruthy();
});
test('selected coupon can be removed and is cleared after checkout or logout', () => {
  const state = {
    ...reducer(undefined, {}),
    cart: {rice: 1},
    couponCode: 'MEALUP50',
  };
  expect(reducer(state, setCouponCode(null)).couponCode).toBeNull();
  expect(
    reducer(
      state,
      placePreviewOrder({id: 'order', address: {full_address: 'Test'}}),
    ).couponCode,
  ).toBeNull();
  expect(reducer(state, resetCommerce()).couponCode).toBeNull();
});
