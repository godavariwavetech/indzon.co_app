/* eslint-env jest */
import {
  MAX_LATITUDE,
  project,
  unproject,
  panCoordinates,
  tapCoordinates,
  visibleTiles,
  cameraForGesture,
  viewportAnchor,
} from '../utils/mapGeometry';

const center = {latitude: 17.0005, longitude: 81.804};
test('map projection preserves coordinates when converting back from tile pixels', () => {
  for (const zoom of [3, 12, 17, 19]) {
    const coordinate = unproject(project(center, zoom), zoom);
    expect(coordinate.latitude).toBeCloseTo(center.latitude, 8);
    expect(coordinate.longitude).toBeCloseTo(center.longitude, 8);
  }
});
test('dragging right moves the selected coordinate west and dragging down moves it north', () => {
  expect(panCoordinates(center, 17, 128, 0).longitude).toBeLessThan(
    center.longitude,
  );
  expect(panCoordinates(center, 17, 0, 128).latitude).toBeGreaterThan(
    center.latitude,
  );
});
test('tapping the pin anchor keeps its coordinate while tapping right selects a point east', () => {
  const selected = tapCoordinates(center, 17, 180, 700 * 0.28, 360, 700, 0.28);
  expect(selected.latitude).toBeCloseTo(center.latitude, 8);
  expect(selected.longitude).toBeCloseTo(center.longitude, 8);
  expect(
    tapCoordinates(center, 17, 300, 700 * 0.28, 360, 700, 0.28).longitude,
  ).toBeGreaterThan(center.longitude);
});
test('only visible tiles are selected and cover the viewport without gaps', () => {
  const tiles = visibleTiles(center, 17, 360, 700, 0.28);
  expect(tiles.length).toBeLessThanOrEqual(15);
  expect(Math.min(...tiles.map(tile => tile.left))).toBeLessThanOrEqual(0);
  expect(
    Math.max(...tiles.map(tile => tile.left + 256)),
  ).toBeGreaterThanOrEqual(360);
  expect(Math.min(...tiles.map(tile => tile.top))).toBeLessThanOrEqual(0);
  expect(Math.max(...tiles.map(tile => tile.top + 256))).toBeGreaterThanOrEqual(
    700,
  );
  expect(visibleTiles(center, 17, 0, 700)).toEqual([]);
});
test('tile coordinates wrap safely at the date line and stay valid near the poles', () => {
  const tiles = visibleTiles({latitude: 0, longitude: 179.99}, 3, 360, 700);
  expect(tiles.some(tile => tile.x === 0)).toBe(true);
  expect(
    tiles.every(tile => tile.x >= 0 && tile.x < 8 && tile.y >= 0 && tile.y < 8),
  ).toBe(true);
  expect(
    unproject(project({latitude: 90, longitude: 0}, 17), 17).latitude,
  ).toBeCloseTo(MAX_LATITUDE, 5);
});

test('fractional zoom tiles align their geographic pixels with the exact marker anchor', () => {
  const zoom = 17.45;
  const anchor = viewportAnchor(360, 700, 0.28, 180, 180);
  const tiles = visibleTiles(center, zoom, 360, 700, anchor.y / 700);
  const point = project(center, Math.floor(zoom));
  const containing = tiles.find(
    tile =>
      tile.x === Math.floor(point.x / 256) &&
      tile.y === Math.floor(point.y / 256),
  );
  const scale = containing.size / 256;
  expect(containing.left + (point.x - containing.x * 256) * scale).toBeCloseTo(
    anchor.x,
    5,
  );
  expect(containing.top + (point.y - containing.y * 256) * scale).toBeCloseTo(
    anchor.y,
    5,
  );
  expect(tiles.every(tile => Number.isInteger(tile.z))).toBe(true);
});

test('the marker and map share an anchor above the address sheet after keyboard resizing', () => {
  for (const height of [700, 450, 300]) {
    const anchor = viewportAnchor(360, height, 0.28, 180, 170);
    const selected = tapCoordinates(
      center,
      17,
      anchor.x,
      anchor.y,
      360,
      height,
      anchor.y / height,
    );
    expect(selected.latitude).toBeCloseTo(center.latitude, 8);
    expect(selected.longitude).toBeCloseTo(center.longitude, 8);
    expect(anchor.y).toBeLessThan(height - 170);
  }
});

test('pinch gestures preserve their focal coordinate even when the zoom limit is reached', () => {
  const viewport = {width: 360, height: 700, anchor: {x: 180, y: 196}};
  const startPoints = [
    {x: 60, y: 260},
    {x: 160, y: 260},
  ];
  const currentPoints = [
    {x: 10, y: 280},
    {x: 310, y: 280},
  ];
  const focal = tapCoordinates(center, 18.8, 110, 260, 360, 700, 0.28);
  const camera = cameraForGesture(
    {center, zoom: 18.8},
    startPoints,
    currentPoints,
    viewport,
    3,
    19,
  );
  expect(camera.zoom).toBe(19);
  const selected = tapCoordinates(
    camera.center,
    camera.zoom,
    160,
    280,
    360,
    700,
    0.28,
  );
  expect(selected.latitude).toBeCloseTo(focal.latitude, 8);
  expect(selected.longitude).toBeCloseTo(focal.longitude, 8);
});
