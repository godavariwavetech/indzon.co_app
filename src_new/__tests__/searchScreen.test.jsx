/* eslint-env jest */
import React from 'react';
import {act, create} from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SearchScreen from '../screens/main/SearchScreen';

jest.mock('../components/main/MainUi', () => ({
  Page: ({children}) => children,
  colors: {muted: '#777777'},
}));
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
let renderer;
let navigation;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks();
  AsyncStorage.getItem.mockResolvedValue(null);
  navigation = {navigate: jest.fn(), goBack: jest.fn()};
});
afterEach(() => {
  if (renderer) {
    act(() => renderer.unmount());
  }
});
async function mount() {
  await act(async () => {
    renderer = create(<SearchScreen navigation={navigation} />);
  });
}

test('category opens an overlay and subcategory opens its product list', async () => {
  await mount();
  act(() =>
    renderer.root
      .findByProps({accessibilityLabel: 'Groceries'})
      .props.onPress(),
  );
  expect(
    renderer.root.findByProps({testID: 'search-subcategory-panel'}),
  ).toBeTruthy();
  expect(navigation.navigate).not.toHaveBeenCalled();
  await act(async () =>
    renderer.root
      .findByProps({accessibilityLabel: 'Browse Rice, Atta & Grains'})
      .props.onPress(),
  );
  expect(navigation.navigate).toHaveBeenCalledWith('ProductList', {
    categoryId: 'grocery',
    subcategoryId: 'rice',
    title: 'Rice, Atta & Grains',
  });
  expect(
    renderer.root.findAllByProps({testID: 'search-subcategory-panel'}),
  ).toHaveLength(0);
});
test('outside tap dismisses the panel without navigating', async () => {
  await mount();
  act(() =>
    renderer.root
      .findByProps({accessibilityLabel: 'Groceries'})
      .props.onPress(),
  );
  act(() =>
    renderer.root
      .findByProps({accessibilityLabel: 'Close subcategories'})
      .props.onPress(),
  );
  expect(
    renderer.root.findAllByProps({testID: 'search-subcategory-panel'}),
  ).toHaveLength(0);
  expect(navigation.navigate).not.toHaveBeenCalled();
});
test('removing and clearing recent searches persists the changes', async () => {
  await mount();
  await act(async () =>
    renderer.root
      .findByProps({accessibilityLabel: 'Remove Laptop'})
      .props.onPress(),
  );
  expect(
    renderer.root.findAllByProps({accessibilityLabel: 'Remove Laptop'}),
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
test('typing dismisses subcategories and returns product results', async () => {
  await mount();
  act(() =>
    renderer.root
      .findByProps({accessibilityLabel: 'Groceries'})
      .props.onPress(),
  );
  act(() =>
    renderer.root
      .findByProps({testID: 'search-screen-input'})
      .props.onChangeText('Coriander'),
  );
  expect(
    renderer.root.findAllByProps({testID: 'search-subcategory-panel'}),
  ).toHaveLength(0);
  expect(JSON.stringify(renderer.toJSON())).toContain(
    'Aashirvaad Coriander Powder',
  );
});
