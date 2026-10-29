/* eslint-env jest */
import {getHomeSections, getLiveItems} from '../services/catalogService';
import api from '../utils/api';

jest.mock('../utils/api', () => ({post: jest.fn()}));

const size = {size: 'M', actual_price: 200, selling_price: 150, sku: 'shirt-m'};
const row = {
  id: 1, shop_id: 1, shop_items_tb_nm: 'items',
  selling_price: 150, actual_price: 200,
  quantity_varient: size,
  variant_options: {size, color: 'Blue'},
};

test('home suggestions expose text labels instead of structured variant records', async () => {
  api.post.mockResolvedValue({data: {data: {suggested: [row]}}});
  const {suggested: [product]} = await getHomeSections({locationId: 1});
  expect(product.unit).toBe('M');
  expect(product.variantOptions).toEqual([['size', 'M'], ['color', 'Blue']]);
  expect(product.price).toBe(150);
});

test('shop detail refresh normalizes JSON variant arrays and preserves scalar options', async () => {
  api.post.mockResolvedValue({data: {data: [{...row,
    quantity_varient: '1 item',
    variant_options: JSON.stringify({size: [size], measurement: '500 g', unknown: {sku: 'x'}}),
  }]}});
  const [product] = await getLiveItems({shopItemsTableName: 'items', shopId: 1});
  expect(product.unit).toBe('1 item');
  expect(product.variantOptions).toEqual([['size', 'M'], ['measurement', '500 g']]);
});
