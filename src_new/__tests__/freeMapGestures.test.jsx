/* eslint-env jest */
import React from 'react';
import {PanResponder} from 'react-native';
import {act, create} from 'react-test-renderer';
import FreeMap from '../components/location/FreeMap';
import {getMapTile} from '../services/mapTiles';
import {panCoordinates, tapCoordinates} from '../utils/mapGeometry';

jest.mock('../services/mapTiles', () => ({getMapTile: jest.fn()}));
jest.mock('react-native-vector-icons/MaterialIcons', () => 'MaterialIcon');
const renderers = [];
const center = {latitude: 17.0005, longitude: 81.804};
let gestureHandlers;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks();
  getMapTile.mockResolvedValue('data:image/png;base64,test');
  jest.spyOn(PanResponder, 'create').mockImplementation(handlers => {
    gestureHandlers = handlers;
    return {panHandlers: {}};
  });
});
afterEach(() => {
  act(() => renderers.splice(0).forEach(renderer => renderer.unmount()));
  jest.restoreAllMocks();
});
const touch = (identifier, x, y) => ({
  identifier,
  locationX: x,
  locationY: y,
  pageX: x + 24,
  pageY: y + 84,
});
const event = (...touches) => ({nativeEvent: {...touches[0], touches}});
const expectCoordinate = (actual, expected) => {
  expect(actual.latitude).toBeCloseTo(expected.latitude, 8);
  expect(actual.longitude).toBeCloseTo(expected.longitude, 8);
};
async function renderMap() {
  const onChange = jest.fn();
  const onMoveStart = jest.fn();
  const overlay = jest.fn(() => null);
  const props = {
    center,
    onMoveStart,
    onRegionChangeComplete: onChange,
    renderOverlay: overlay,
    testID: 'free-map',
  };
  let renderer;
  await act(async () => {
    renderer = create(<FreeMap {...props} />);
  });
  renderers.push(renderer);
  const layoutNode = renderer.root
    .findAllByProps({testID: 'free-map'})
    .find(node => node.props.onLayout);
  await act(async () => {
    layoutNode.props.onLayout({
      nativeEvent: {layout: {width: 360, height: 700}},
    });
  });
  return {
    renderer,
    onChange,
    onMoveStart,
    props,
    currentView: () => overlay.mock.calls.at(-1)[0],
  };
}

test('dragging updates the painted map immediately and settling cannot rewind it using stale gesture deltas', async () => {
  const {onChange, onMoveStart, currentView} = await renderMap();
  act(() => {
    gestureHandlers.onPanResponderGrant(event(touch(1, 100, 220)));
  });
  await act(async () => {
    gestureHandlers.onPanResponderMove(event(touch(1, 228, 220)), {
      dx: 128,
      dy: 0,
    });
  });
  const painted = currentView().camera.center;
  expectCoordinate(painted, panCoordinates(center, 17, 128, 0));
  expect(onChange).not.toHaveBeenCalled();
  act(() => {
    gestureHandlers.onPanResponderRelease(event(), {dx: 9999, dy: 9999});
  });
  expectCoordinate(onChange.mock.calls[0][0], painted);
  expectCoordinate(currentView().camera.center, painted);
  expect(onMoveStart).toHaveBeenCalledTimes(1);
});

test('pinching preserves the place beneath the moving finger midpoint and retains fractional zoom on release', async () => {
  const {onChange, currentView} = await renderMap();
  const focal = tapCoordinates(center, 17, 110, 260, 360, 700, 0.28);
  act(() => {
    gestureHandlers.onPanResponderGrant(
      event(touch(1, 60, 260), touch(2, 160, 260)),
    );
  });
  await act(async () => {
    gestureHandlers.onPanResponderMove(
      event(touch(1, 40, 280), touch(2, 170, 280)),
      {},
    );
  });
  const painted = currentView().camera;
  expect(painted.zoom).toBeCloseTo(17 + Math.log2(1.3), 8);
  expectCoordinate(
    tapCoordinates(painted.center, painted.zoom, 105, 280, 360, 700, 0.28),
    focal,
  );
  act(() => {
    gestureHandlers.onPanResponderRelease(event(), {});
  });
  expect(currentView().camera.zoom).toBe(painted.zoom);
  expectCoordinate(onChange.mock.calls[0][0], painted.center);
  expect(
    getMapTile.mock.calls.every(([tile]) => Number.isInteger(tile.z)),
  ).toBe(true);
});

test('adding or lifting a finger does not jump the map and one-finger dragging continues after a pinch', async () => {
  const {currentView} = await renderMap();
  act(() => {
    gestureHandlers.onPanResponderGrant(event(touch(1, 100, 220)));
  });
  await act(async () => {
    gestureHandlers.onPanResponderMove(event(touch(1, 140, 230)), {});
  });
  const afterPan = currentView().camera;
  await act(async () => {
    gestureHandlers.onPanResponderMove(
      event(touch(1, 140, 230), touch(2, 220, 230)),
      {},
    );
  });
  expectCoordinate(currentView().camera.center, afterPan.center);
  await act(async () => {
    gestureHandlers.onPanResponderMove(
      event(touch(1, 120, 250), touch(2, 240, 250)),
      {},
    );
  });
  const afterPinch = currentView().camera;
  await act(async () => {
    gestureHandlers.onPanResponderMove(event(touch(1, 120, 250)), {});
  });
  expectCoordinate(currentView().camera.center, afterPinch.center);
  await act(async () => {
    gestureHandlers.onPanResponderMove(event(touch(1, 150, 270)), {});
  });
  expectCoordinate(
    currentView().camera.center,
    panCoordinates(afterPinch.center, afterPinch.zoom, 30, 20),
  );
  expect(currentView().camera.zoom).toBe(afterPinch.zoom);
});

test('map taps use viewport coordinates rather than screen coordinates that include the header', async () => {
  const {onChange, currentView} = await renderMap();
  act(() => {
    gestureHandlers.onPanResponderGrant(event(touch(1, 270, 300)));
    gestureHandlers.onPanResponderRelease(event(touch(1, 270, 300)), {});
  });
  const expected = tapCoordinates(center, 17, 270, 300, 360, 700, 0.28);
  expectCoordinate(onChange.mock.calls[0][0], expected);
  expectCoordinate(currentView().camera.center, expected);
});

test('an interrupted gesture commits the coordinate currently painted under the marker', async () => {
  const {onChange, currentView} = await renderMap();
  act(() => {
    gestureHandlers.onPanResponderGrant(event(touch(1, 100, 220)));
  });
  await act(async () => {
    gestureHandlers.onPanResponderMove(event(touch(1, 140, 250)), {});
  });
  const painted = currentView().camera.center;
  act(() => {
    gestureHandlers.onPanResponderTerminate();
  });
  expectCoordinate(onChange.mock.calls[0][0], painted);
  expectCoordinate(currentView().camera.center, painted);
});

test('zoom controls retain the selected coordinate and searched coordinates replace the map camera', async () => {
  const {renderer, onChange, props, currentView} = await renderMap();
  await act(async () => {
    renderer.root.findByProps({testID: 'map-zoom-in'}).props.onPress();
  });
  expect(getMapTile.mock.calls.some(([tile]) => tile.z === 18)).toBe(true);
  expectCoordinate(currentView().camera.center, center);
  expect(onChange).not.toHaveBeenCalled();
  const searched = {latitude: 18, longitude: 82};
  await act(async () => {
    renderer.update(<FreeMap {...props} center={searched} />);
  });
  expectCoordinate(currentView().camera.center, searched);
  expect(currentView().camera.zoom).toBe(18);
});
