export const TILE_SIZE = 256;
export const MAX_LATITUDE = 85.05112878;
const clamp = (value, minimum, maximum) =>
  Math.min(maximum, Math.max(minimum, value));

export function project(coordinates, zoom) {
  const size = TILE_SIZE * 2 ** zoom;
  const latitude = clamp(coordinates.latitude, -MAX_LATITUDE, MAX_LATITUDE);
  const sine = Math.sin((latitude * Math.PI) / 180);
  return {
    x: ((coordinates.longitude + 180) / 360) * size,
    y: (0.5 - Math.log((1 + sine) / (1 - sine)) / (4 * Math.PI)) * size,
  };
}

export function unproject(point, zoom) {
  const size = TILE_SIZE * 2 ** zoom;
  const x = ((point.x % size) + size) % size;
  const y = clamp(point.y, 0, size);
  return {
    latitude:
      (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / size))) * 180) / Math.PI,
    longitude: (x / size) * 360 - 180,
  };
}

export function panCoordinates(center, zoom, dx, dy) {
  const point = project(center, zoom);
  return unproject({x: point.x - dx, y: point.y - dy}, zoom);
}

export function tapCoordinates(center, zoom, x, y, width, height, anchorRatio) {
  const point = project(center, zoom);
  return unproject(
    {x: point.x + x - width / 2, y: point.y + y - height * anchorRatio},
    zoom,
  );
}

export function viewportAnchor(
  width,
  height,
  anchorRatio,
  minimumY = 0,
  bottomInset = 0,
) {
  const maximumY = Math.max(0, height - bottomInset - 16);
  return {
    x: width / 2,
    y: Math.min(maximumY, Math.max(height * anchorRatio, minimumY)),
  };
}

export function cameraForGesture(
  camera,
  startPoints,
  currentPoints,
  viewport,
  minimumZoom,
  maximumZoom,
) {
  const midpoint = points => ({
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
  });
  const start = midpoint(startPoints);
  const current = midpoint(currentPoints);
  let zoom = camera.zoom;
  if (startPoints.length === 2 && currentPoints.length === 2) {
    const distance = points =>
      Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
    const initialDistance = distance(startPoints);
    if (initialDistance > 0) {
      zoom = clamp(
        camera.zoom +
          Math.log2(Math.max(0.01, distance(currentPoints)) / initialDistance),
        minimumZoom,
        maximumZoom,
      );
    }
  }
  const focalCoordinate = tapCoordinates(
    camera.center,
    camera.zoom,
    start.x,
    start.y,
    viewport.width,
    viewport.height,
    viewport.anchor.y / viewport.height,
  );
  const focalPoint = project(focalCoordinate, zoom);
  return {
    zoom,
    center: unproject(
      {
        x: focalPoint.x - current.x + viewport.anchor.x,
        y: focalPoint.y - current.y + viewport.anchor.y,
      },
      zoom,
    ),
  };
}

export function visibleTiles(
  center,
  zoom,
  width,
  height,
  anchorRatio = 0.5,
  padding = 0,
  tileZoomOverride = null,
) {
  if (!width || !height) {
    return [];
  }
  const point = project(center, zoom);
  const left = point.x - width / 2;
  const top = point.y - height * anchorRatio;
  const tileZoom =
    tileZoomOverride === null ? Math.floor(zoom) : tileZoomOverride;
  const tileSize = TILE_SIZE * 2 ** (zoom - tileZoom);
  const count = 2 ** tileZoom;
  const tiles = [];
  for (
    let y = Math.max(0, Math.floor((top - padding) / tileSize));
    y <=
    Math.min(count - 1, Math.ceil((top + height + padding) / tileSize) - 1);
    y++
  ) {
    for (
      let x = Math.floor((left - padding) / tileSize);
      x <= Math.ceil((left + width + padding) / tileSize) - 1;
      x++
    ) {
      tiles.push({
        x: ((x % count) + count) % count,
        y,
        z: tileZoom,
        size: tileSize,
        left: x * tileSize - left,
        top: y * tileSize - top,
        key: `${tileZoom}/${x}/${y}`,
      });
    }
  }
  return tiles;
}
