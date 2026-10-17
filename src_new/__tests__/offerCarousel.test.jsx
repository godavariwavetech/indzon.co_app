/* eslint-env jest */
import React from 'react';
import {act, create} from 'react-test-renderer';
import {AccessibilityInfo, AppState, FlatList} from 'react-native';
import {useIsFocused} from '@react-navigation/native';
import OfferCarousel from '../components/main/OfferCarousel';

jest.mock('@react-navigation/native', () => ({
  useIsFocused: jest.fn(() => true),
}));
jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

const offers = ['a', 'b', 'c'].map(id => ({
  id,
  categoryId: '10',
  title: id,
  source: {uri: `http://x/${id}.png`},
  background: '#EAF1FC',
  imageOnly: true,
}));

// The first native render initializes and transforms RN's virtualized list.
jest.setTimeout(20000);

let renderer;
let scroll;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.useFakeTimers();
  useIsFocused.mockReturnValue(true);
  AppState.currentState = 'active';
  jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(false);
  scroll = jest
    .spyOn(FlatList.prototype, 'scrollToOffset')
    .mockImplementation(() => {});
});
afterEach(() => {
  if (renderer) {
    act(() => renderer.unmount());
    renderer = null;
  }
  jest.restoreAllMocks();
  jest.useRealTimers();
});
async function mount() {
  await act(async () => {
    renderer = create(<OfferCarousel navigation={{navigate: jest.fn()}} offers={offers} />);
  });
  act(() => jest.advanceTimersByTime(20));
  scroll.mockClear();
  return renderer.root.findByType(FlatList);
}

test('rotates after four seconds, and pauses while touched', async () => {
  const list = await mount();
  act(() => list.props.onTouchStart());
  act(() => jest.advanceTimersByTime(5000));
  expect(scroll).not.toHaveBeenCalled();
  act(() => list.props.onTouchEnd());
  act(() => jest.advanceTimersByTime(4000));
  expect(scroll).toHaveBeenCalledWith({
    offset: list.props.snapToInterval * 2,
    animated: true,
  });
});

test('wraps seamlessly from the trailing duplicate back to the first offer', async () => {
  const list = await mount();
  act(() =>
    list.props.onMomentumScrollEnd({
      nativeEvent: {contentOffset: {x: list.props.snapToInterval * 4}},
    }),
  );
  expect(scroll).toHaveBeenCalledWith({
    offset: list.props.snapToInterval,
    animated: false,
  });
  scroll.mockClear();
  act(() => jest.advanceTimersByTime(4000));
  expect(scroll).toHaveBeenCalledWith({
    offset: list.props.snapToInterval * 2,
    animated: true,
  });
});

test('does not rotate with reduced motion or an unfocused screen', async () => {
  AccessibilityInfo.isReduceMotionEnabled.mockResolvedValue(true);
  await mount();
  act(() => jest.advanceTimersByTime(12000));
  expect(scroll).not.toHaveBeenCalled();
  act(() => renderer.unmount());
  renderer = null;
  AccessibilityInfo.isReduceMotionEnabled.mockResolvedValue(false);
  useIsFocused.mockReturnValue(false);
  await mount();
  act(() => jest.advanceTimersByTime(12000));
  expect(scroll).not.toHaveBeenCalled();
});
