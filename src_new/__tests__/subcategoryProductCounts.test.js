/* eslint-env jest */
import {getSubcategoryProductCounts, groupVariants} from '../services/catalogService';

jest.mock('../utils/api', () => ({post: jest.fn()}));

const subcategories = [{id: 'fresh', shopIds: ['1', '2']}];
const product = (id, shopId, uniqueCode, price, subcategoryId = 'fresh') => ({
  id, shopId, uniqueCode, price, subcategoryId, shopItemsTableName: 'produce',
});

test('four raw variant rows show three cards and a count of three', () => {
  const items = [
    product('1', '1', 'apple', 100), product('2', '1', 'apple', 80),
    product('3', '1', 'pear', 90), product('4', '1', 'orange', 60),
  ];
  expect(getSubcategoryProductCounts(items, subcategories).fresh).toBe(3);
  expect(groupVariants(items)).toHaveLength(3);
});

test('counts only the shop that the existing click handler opens', () => {
  const items = [
    product('1', '1', 'apple', 80), product('2', '1', 'pear', 90),
    product('3', '1', 'orange', 60), product('4', '2', 'banana', 50),
  ];
  expect(getSubcategoryProductCounts(items, subcategories).fresh).toBe(3);
});

test('groups variants before applying the product-page price filter', () => {
  const items = [product('1', '1', 'apple', 600), product('2', '1', 'apple', 400)];
  expect(getSubcategoryProductCounts(items, subcategories, item => item.price < 500).fresh).toBe(1);
});

test('does not count products from another subcategory', () => {
  const items = [product('1', '1', 'apple', 80), product('2', '1', 'milk', 50, 'dairy')];
  expect(getSubcategoryProductCounts(items, subcategories).fresh).toBe(1);
  expect(getSubcategoryProductCounts([], subcategories).fresh).toBe(0);
});
