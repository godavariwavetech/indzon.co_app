import { getBaseSellingPrice } from '../src/utils/orderPricing';

test('standard menu items send the actual base total instead of zero', () => {
  const items = [
    { selling_price: '140', quantity: 2 },
    { selling_price: '100', quantity: 1 },
  ];
  expect(items.reduce((sum, item) => sum + getBaseSellingPrice(item) * item.quantity, 0)).toBe(380);
  expect(items.map(getBaseSellingPrice)).toEqual([140, 100]);
});

test('preserves the base price supplied for customized items', () => {
  expect(getBaseSellingPrice({ sellingprice: '100', selling_price: '140' })).toBe(100);
});

test.each([0, '0', '', null, undefined, 'invalid'])(
  'uses the selling price when the base price is %j', basePrice => {
    const items = [
      { sellingprice: basePrice, selling_price: '140', quantity: 2 },
      { sellingprice: basePrice, selling_price: '100', quantity: 1 },
    ];
    expect(items.map(getBaseSellingPrice)).toEqual([140, 100]);
    expect(items.reduce((sum, item) => sum + getBaseSellingPrice(item) * item.quantity, 0)).toBe(380);
  },
);
