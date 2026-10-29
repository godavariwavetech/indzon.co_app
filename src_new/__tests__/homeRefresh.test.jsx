/* eslint-env jest */
import React from 'react';
import {act, create} from 'react-test-renderer';
import {RefreshControl} from 'react-native';
import HomeContent from '../screens/main/HomeContent';
import {getLiveCategories, getLiveBanners, getHomeSections, refreshLiveItems} from '../services/catalogService';

jest.mock('react-redux', () => ({
  useSelector: selector => selector({Auth: {locationId: 1}, commerce: {cart: {'table:1': 2}}}),
  useDispatch: () => jest.fn(),
}));
jest.mock('../redux/reducers/auth', () => ({
  setLocationId: jest.fn(), setLocationName: jest.fn(),
}));
jest.mock('../services/catalogService', () => ({
  liveCatalogEnabled: true,
  getLiveCategories: jest.fn(), getLiveBanners: jest.fn(), getHomeSections: jest.fn(),
  refreshLiveItems: jest.fn(),
}));
jest.mock('../components/main/MainUi', () => ({
  Page: ({children}) => children, EmptyState: () => null,
  SearchField: () => null, ui: {}, colors: {},
}));
jest.mock('../components/main/Skeleton', () => ({
  HomeBannerSkeleton: () => null, HomeCategoriesSkeleton: () => null,
  HomeDealsSkeleton: () => null, HomeProductsSkeleton: () => null,
}));
jest.mock('../components/main/ReferenceArtwork', () => () => null);
jest.mock('../components/main/ProductCard', () => () => null);
jest.mock('../components/main/CartPill', () => () => null);
jest.mock('../components/main/BannerImage', () => () => null);
jest.mock('../components/main/OfferCarousel', () => () => null);
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

let renderer;
const category = id => ({id, name: `Category ${id}`, art: {}, highlight: true});
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks();
  getLiveCategories.mockResolvedValue([category('1'), category('2')]);
  getLiveBanners.mockResolvedValue([]);
  refreshLiveItems.mockResolvedValue({});
  getHomeSections.mockResolvedValue({highlightedCategories: [], topDeals: [], suggested: []});
});
afterEach(() => act(() => renderer?.unmount()));
const refreshControl = () => renderer.root.findByType(RefreshControl);
async function mount() {
  await act(async () => { renderer = create(<HomeContent navigation={{navigate: jest.fn()}} />); });
}
test('pull-to-refresh removes categories omitted by the server, including an empty list', async () => {
  await mount();
  expect(renderer.root.findAllByProps({accessibilityLabel: 'Browse Category 2'}).length).toBeGreaterThan(0);
  getLiveCategories.mockResolvedValue([category('1')]);
  await act(async () => refreshControl().props.onRefresh());
  expect(renderer.root.findAllByProps({accessibilityLabel: 'Browse Category 2'})).toHaveLength(0);
  getLiveCategories.mockResolvedValue([]);
  await act(async () => refreshControl().props.onRefresh());
  expect(renderer.root.findAllByProps({accessibilityLabel: 'Browse Category 1'})).toHaveLength(0);
});
test('the refresh indicator waits for the category response', async () => {
  await mount();
  let finish;
  getLiveCategories.mockReturnValue(new Promise(resolve => { finish = resolve; }));
  await act(async () => refreshControl().props.onRefresh());
  expect(refreshControl().props.refreshing).toBe(true);
  await act(async () => finish([]));
  expect(refreshControl().props.refreshing).toBe(false);
});

test('home refresh also reloads cart prices and waits for them', async () => {
  await mount();
  let finish;
  refreshLiveItems.mockReturnValue(new Promise(resolve => { finish = resolve; }));
  await act(async () => refreshControl().props.onRefresh());
  expect(refreshLiveItems).toHaveBeenCalledWith(['table:1'], 1);
  expect(refreshControl().props.refreshing).toBe(true);
  await act(async () => finish({}));
  expect(refreshControl().props.refreshing).toBe(false);
});

test('a failed refresh reports the failure instead of silently displaying stale categories', async () => {
  await mount();
  getLiveCategories.mockRejectedValue(new Error('Server unavailable'));
  await act(async () => refreshControl().props.onRefresh());
  expect(renderer.root.findAllByProps({accessibilityRole: 'alert'}).length).toBeGreaterThan(0);
  expect(refreshControl().props.refreshing).toBe(false);
});
