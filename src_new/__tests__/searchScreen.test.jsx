/* eslint-env jest */
import React from 'react';
import {act, create} from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SearchScreen from '../screens/main/SearchScreen';
import {
  getLiveCategories,
  getLiveSubcategories,
  searchAll,
} from '../services/catalogService';

jest.mock('../components/main/MainUi', () => ({
  Page: ({children}) => children,
  colors: {muted: '#777777'},
}));
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('react-redux', () => ({
  useSelector: selector => selector({Auth: {locationId: 1}}),
}));
jest.mock('../services/catalogService', () => ({
  liveCatalogEnabled: true,
  getLiveCategories: jest.fn(),
  getLiveSubcategories: jest.fn(),
  searchAll: jest.fn(),
}));

let renderer;
let navigation;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks();
  AsyncStorage.getItem.mockResolvedValue(JSON.stringify(['Milk', 'Rice']));
  getLiveCategories.mockResolvedValue([
    {
      id: '10',
      name: 'Grocery',
      shortName: 'Grocery',
      art: {source: {uri: 'http://x/grocery.png'}},
    },
  ]);
  getLiveSubcategories.mockResolvedValue([
    {
      id: '19',
      name: 'Pulses',
      shopIds: ['702'],
      art: {source: {uri: 'http://x/pulses.png'}},
    },
    {id: '20', name: 'Rice', shopIds: ['702'], art: {source: {uri: 'http://x/rice.png'}}},
  ]);
  searchAll.mockResolvedValue([
    {
      key: '1-z_grocery_item_lst_t-7',
      kind: 'item',
      name: 'Aashirvaad Chakki Atta 5kg',
      tagline: 'Item',
      art: {source: {uri: 'http://x/atta.png'}},
      product: {id: 'z_grocery_item_lst_t:7', name: 'Aashirvaad Chakki Atta 5kg'},
    },
  ]);
  navigation = {navigate: jest.fn(), goBack: jest.fn()};
});
afterEach(() => {
  if (renderer) {
    act(() => renderer.unmount());
  }
  jest.useRealTimers();
});
async function mount() {
  await act(async () => {
    renderer = create(<SearchScreen navigation={navigation} />);
  });
}

test('a live category opens its shop list', async () => {
  await mount();
  act(() =>
    renderer.root.findByProps({accessibilityLabel: 'Grocery'}).props.onPress(),
  );
  expect(navigation.navigate).toHaveBeenCalledWith('CategoryDetails', {
    categoryId: '10',
    selectionRequest: expect.any(Number),
  });
});

test('shows one subcategory from each category and opens its products', async () => {
  await mount();
  expect(getLiveSubcategories).toHaveBeenCalledWith({
    categoryId: '10',
    locationId: 1,
  });
  // only the first subcategory of the category is listed
  expect(
    renderer.root.findAllByProps({accessibilityLabel: 'Rice in Grocery'}),
  ).toHaveLength(0);
  act(() =>
    renderer.root
      .findByProps({accessibilityLabel: 'Pulses in Grocery'})
      .props.onPress(),
  );
  expect(navigation.navigate).toHaveBeenCalledWith('ProductList', {
    categoryId: '10',
    subcategoryId: '19',
    shopId: '702',
    shopItemsTableName: undefined,
  });
});

test('removing and clearing recent searches persists the changes', async () => {
  await mount();
  await act(async () =>
    renderer.root
      .findByProps({accessibilityLabel: 'Remove Milk'})
      .props.onPress(),
  );
  expect(
    renderer.root.findAllByProps({accessibilityLabel: 'Remove Milk'}),
  ).toHaveLength(0);
  await act(async () =>
    renderer.root
      .findByProps({accessibilityLabel: 'Clear all recent searches'})
      .props.onPress(),
  );
  expect(AsyncStorage.setItem).toHaveBeenLastCalledWith(
    'amaraa.search.recent.v1',
    '[]',
  );
});

test('typing searches the backend with the delivery location and shows results', async () => {
  jest.useFakeTimers();
  await mount();
  act(() =>
    renderer.root
      .findByProps({testID: 'search-screen-input'})
      .props.onChangeText('Atta'),
  );
  await act(async () => {
    jest.advanceTimersByTime(400);
  });
  expect(searchAll).toHaveBeenCalledWith('Atta', 1);
  expect(JSON.stringify(renderer.toJSON())).toContain(
    'Aashirvaad Chakki Atta 5kg',
  );
});
