/* eslint-env jest */
import React from 'react';
import {act, create} from 'react-test-renderer';
import {CartScreen} from '../screens/main/CommerceScreens';
import {createLiveItemCache} from '../services/liveItemCache';
import api from '../utils/api';
import {endpoints} from '../config/config';
import ConfirmDialog from '../components/main/ConfirmDialog';
import {getLiveCoupons} from '../services/catalogService';

const mockId = 'z_grocery_item_lst_t:1';
let mockCache;
let mockState;
const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({
  useSelector: selector => selector(mockState), useDispatch: () => mockDispatch,
}));
jest.mock('../utils/api', () => ({__esModule: true, default: {post: jest.fn()}}));
jest.mock('../screens/main/MainCategoriesScreen', () => ({matchesFilter: () => true}));
jest.mock('../screens/main/ProductDetailsScreen', () => () => null);
jest.mock('../components/main/OrderShipment', () => () => null);
jest.mock('../components/main/SuccessCelebration', () => () => null);
jest.mock('../components/main/ProductCard', () => () => null);
jest.mock('../components/main/CartPill', () => () => null);
jest.mock('../components/main/ReferenceArtwork', () => () => null);
jest.mock('../components/main/ConfirmDialog', () => () => null);
jest.mock('../components/main/MainUi', () => ({
  ...jest.requireActual('../components/main/MainUi'),
  Page: ({children}) => children,
  Footer: ({children}) => children,
  Heading: () => null,
}));
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('../services/catalogService', () => ({
  liveCatalogEnabled: true,
  getLiveCategories: jest.fn(async () => []),
  getLiveItems: jest.fn(async () => []),
  getOrderCharges: jest.fn(async () => ({total: 0})),
  getLiveCoupons: jest.fn(async () => []),
  evaluateLiveCoupon: (...args) => jest.requireActual('../services/catalogService').evaluateLiveCoupon(...args),
  refreshLiveItems: (ids, area) => mockCache.refresh(ids, area),
  useLiveItemsByIds: ids => {
    const ReactHooks = require('react');
    const [, render] = ReactHooks.useState(0);
    ReactHooks.useEffect(() => mockCache.subscribe(() => render(n => n + 1)), []);
    return {itemsById: Object.fromEntries(ids.map(id => [id, mockCache.get(id, 1)]))};
  },
}));

const product = price => ({id: mockId, itemId: 1, price, originalPrice: 150,
  gstPercent: 0, shopId: '1', categoryId: '10', name: 'Test product', art: {}});
let renderer;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks();
  getLiveCoupons.mockResolvedValue([]);
  mockDispatch.mockImplementation(action => {
    if (action.type === 'commerce/setCouponCode') {
      mockState.commerce.couponCode = action.payload;
    }
  });
});
afterEach(() => { if (renderer) { act(() => renderer.unmount()); } });

test('price change while Cart stays open blocks the first order and uses the new price after review', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks();
  const load = jest.fn().mockResolvedValue(product(100));
  mockCache = createLiveItemCache(load);
  await mockCache.refresh([mockId], 1);
  mockState = {Auth: {locationId: 1, customerId: 7,
    deliveryAddress: {full_address: 'Test address', location_id: 1}},
  commerce: {cart: {[mockId]: 2}, couponCode: null}};
  const navigation = {navigate: jest.fn(), reset: jest.fn()};
  await act(async () => { renderer = create(<CartScreen navigation={navigation} />); });

  // The dashboard changes the backend price; the user has not left Cart or refreshed.
  load.mockResolvedValue(product(120));
  await act(async () => {
    await renderer.root.findByProps({accessibilityLabel: 'Place order'}).props.onPress();
  });
  expect(api.post).not.toHaveBeenCalled();
  expect(mockDispatch).not.toHaveBeenCalled();
  expect(mockState.commerce.cart[mockId]).toBe(2);
  expect(mockCache.get(mockId, 1).price).toBe(120);
  expect(renderer.root.findByType(ConfirmDialog).props.message).toContain('prices have changed');

  await act(async () => renderer.root.findByType(ConfirmDialog).props.onConfirm());
  api.post.mockResolvedValue({data: {status: 200, id: 42, order_id: '000042'}});
  await act(async () => {
    await renderer.root.findByProps({accessibilityLabel: 'Place order'}).props.onPress();
  });
  expect(api.post).toHaveBeenCalledTimes(1);
  expect(api.post).toHaveBeenCalledWith(endpoints.PLACE_ORDER, expect.objectContaining({
    total_amount: 240,
    sub_order_array: [expect.objectContaining({item_price: 120, sub_item_count: 2, item_total_amount: 240})],
  }));
});

const offer = cap => ({id: 9, code: 'SAVE', percent: 0, cap, minBill: 0});
async function mountWithCoupon() {
  mockCache = createLiveItemCache(jest.fn(async () => product(100)));
  await mockCache.refresh([mockId], 1);
  mockState = {Auth: {locationId: 1, customerId: 7,
    deliveryAddress: {full_address: 'Test address', location_id: 1}},
  commerce: {cart: {[mockId]: 2}, couponCode: 'SAVE'}};
  getLiveCoupons.mockResolvedValue([offer(20)]);
  await act(async () => { renderer = create(<CartScreen navigation={{navigate: jest.fn(), reset: jest.fn()}} />); });
}
const placeOrder = async () => act(async () => {
  await renderer.root.findByProps({accessibilityLabel: 'Place order'}).props.onPress();
});

test('a coupon deleted while Cart stays open is removed before ordering, with cart quantities preserved', async () => {
  await mountWithCoupon();
  getLiveCoupons.mockResolvedValue([]);
  await placeOrder();
  expect(api.post).not.toHaveBeenCalled();
  expect(mockState.commerce.couponCode).toBeNull();
  expect(mockState.commerce.cart[mockId]).toBe(2);
  expect(renderer.root.findByType(ConfirmDialog).props.message).toContain('discount has been removed');
  await act(async () => renderer.root.findByType(ConfirmDialog).props.onConfirm());
  api.post.mockResolvedValue({data: {status: 200, id: 42, order_id: '000042'}});
  await placeOrder();
  expect(api.post).toHaveBeenCalledWith(endpoints.PLACE_ORDER,
    expect.objectContaining({coupon_amount: 0, grand_total: 200}));
});

test('changed coupon value requires review before submitting the revised discount', async () => {
  await mountWithCoupon();
  getLiveCoupons.mockResolvedValue([offer(10)]);
  await placeOrder();
  expect(api.post).not.toHaveBeenCalled();
  expect(renderer.root.findByType(ConfirmDialog).props.message).toContain('coupon has changed');
  await act(async () => renderer.root.findByType(ConfirmDialog).props.onConfirm());
  api.post.mockResolvedValue({data: {status: 200, id: 42, order_id: '000042'}});
  await placeOrder();
  expect(api.post).toHaveBeenCalledWith(endpoints.PLACE_ORDER,
    expect.objectContaining({coupon_amount: 10, grand_total: 190}));
});

test('a failed coupon check blocks ordering and preserves the coupon and all cart items', async () => {
  await mountWithCoupon();
  getLiveCoupons.mockRejectedValue(new Error('Could not verify current coupons. Please try again.'));
  await placeOrder();
  expect(api.post).not.toHaveBeenCalled();
  expect(mockState.commerce.couponCode).toBe('SAVE');
  expect(mockState.commerce.cart[mockId]).toBe(2);
  expect(renderer.root.findByType(ConfirmDialog).props.message).toContain('Could not verify');
});
