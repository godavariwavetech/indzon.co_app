import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Image,
  Linking,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {freeMaps} from '../../config/freeMaps';
import {getMapTile} from '../../services/mapTiles';
import {
  cameraForGesture,
  panCoordinates,
  project,
  unproject,
  tapCoordinates,
  viewportAnchor,
  visibleTiles,
  TILE_SIZE,
} from '../../utils/mapGeometry';

function Tile({tile, retry, onError}) {
  const [uri, setUri] = useState(null);
  const errorCallback = useRef(onError);
  errorCallback.current = onError;
  useEffect(() => {
    let mounted = true;
    getMapTile({x: tile.x, y: tile.y, z: tile.z}).then(
      value => {
        if (mounted) {
          setUri(value);
        }
      },
      () => {
        if (mounted) {
          errorCallback.current();
        }
      },
    );
    return () => {
      mounted = false;
    };
  }, [tile.x, tile.y, tile.z, retry]);
  return uri ? (
    <Image
      source={{uri}}
      resizeMode="stretch"
      fadeDuration={0}
      style={[
        styles.tile,
        {left: tile.left, top: tile.top, width: tile.size, height: tile.size},
      ]}
      accessible={false}
    />
  ) : null;
}

function eventPoints(event, origin) {
  return (event.nativeEvent.touches || [])
    .slice(0, 2)
    .map((touch, index) => ({
      id: touch.identifier ?? index,
      x: Number.isFinite(touch.pageX)
        ? touch.pageX - origin.x
        : touch.locationX,
      y: Number.isFinite(touch.pageY)
        ? touch.pageY - origin.y
        : touch.locationY,
    }))
    .filter(point => Number.isFinite(point.x) && Number.isFinite(point.y));
}

const fingerSignature = points =>
  points
    .map(point => point.id)
    .sort()
    .join(',');
const sameCenter = (a, b) =>
  Math.abs(a.latitude - b.latitude) + Math.abs(a.longitude - b.longitude) <
  1e-12;

export default function FreeMap({
  center,
  anchorRatio = 0.28,
  minimumAnchorY = 0,
  attributionBottom = 180,
  contentBottomInset = 0,
  onMoveStart,
  onRegionChangeComplete,
  onLocate,
  locatingDevice,
  renderOverlay,
  testID,
}) {
  const [size, setSize] = useState({width: 0, height: 0});
  const [camera, setCamera] = useState({center, zoom: 17});
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const cameraRef = useRef(camera);
  const propCenter = useRef(center);
  const latest = useRef({});
  const gesture = useRef(null);
  const renderedCamera = useRef(camera);
  const translate = useRef(new Animated.ValueXY({x: 0, y: 0})).current;
  const scale = useRef(new Animated.Value(1)).current;
  const layerOpacity = useRef(new Animated.Value(1)).current;
  const fadeMotion = useRef(null);
  const motionFrame = useRef(null);
  const motionTarget = useRef(null);
  const anchor = viewportAnchor(
    size.width,
    // Center the selected coordinate in the map visible above the footer.
    Math.max(0, size.height - contentBottomInset),
    anchorRatio,
    minimumAnchorY,
    Math.max(0, attributionBottom - contentBottomInset),
  );
  const viewport = {...size, anchor};
  latest.current = {viewport, onMoveStart, onRegionChangeComplete};
  const zoom = camera.zoom;

  // Keep the tile tree still while the finger moves. Only its transform changes.
  const updateCamera = next => {
    cameraRef.current = next;
    const baseline = renderedCamera.current;
    const currentViewport = latest.current.viewport;
    const ratio = 2 ** (next.zoom - baseline.zoom);
    const oldPoint = project(baseline.center, next.zoom);
    const newPoint = project(next.center, next.zoom);
    const worldSize = TILE_SIZE * 2 ** next.zoom;
    let dx = oldPoint.x - newPoint.x;
    dx -= Math.round(dx / worldSize) * worldSize;
    const offset = {
      x:
        dx +
        (1 - ratio) * (currentViewport.anchor.x - currentViewport.width / 2),
      y:
        oldPoint.y -
        newPoint.y +
        (1 - ratio) * (currentViewport.anchor.y - currentViewport.height / 2),
    };
    translate.setValue(offset);
    scale.setValue(ratio);
  };
  const settleCamera = next => {
    cameraRef.current = next;
    setCamera(next);
  };
  const refreshBuffer = next => {
    const baseline = renderedCamera.current;
    const a = project(baseline.center, next.zoom);
    const b = project(next.center, next.zoom);
    if (
      Math.hypot(a.x - b.x, a.y - b.y) > TILE_SIZE / 2 ||
      Math.abs(next.zoom - baseline.zoom) > 0.6
    ) {
      settleCamera(next);
    }
  };
  const stopMotion = () => {
    if (motionFrame.current !== null) {
      cancelAnimationFrame(motionFrame.current);
      motionFrame.current = null;
    }
    motionTarget.current = null;
    fadeMotion.current?.stop();
    fadeMotion.current = null;
    layerOpacity.setValue(1);
  };
  const animateCamera = (target, complete = false, duration = 320) => {
    stopMotion();
    motionTarget.current = {target, complete};
    const start = cameraRef.current;
    const startPoint = project(start.center, 17);
    const targetPoint = project(target.center, 17);
    const worldSize = TILE_SIZE * 2 ** 17;
    let dx = targetPoint.x - startPoint.x;
    dx -= Math.round(dx / worldSize) * worldSize;
    const distance =
      Math.hypot(dx, targetPoint.y - startPoint.y) * 2 ** (start.zoom - 17);
    const currentViewport = latest.current.viewport;
    if (
      distance >
      Math.max(currentViewport.width, currentViewport.height, TILE_SIZE) * 2
    ) {
      // A distant search should load its destination, not request every street
      // along an animated journey. Nearby selections still glide naturally.
      motionTarget.current = null;
      settleCamera(target);
      layerOpacity.setValue(0);
      const animation = Animated.timing(layerOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      });
      fadeMotion.current = animation;
      animation.start(({finished}) => {
        if (fadeMotion.current === animation) {
          fadeMotion.current = null;
        }
        if (finished && complete) {
          latest.current.onRegionChangeComplete?.(target.center);
        }
      });
      return;
    }
    const began = Date.now();
    const frame = () => {
      const progress = Math.min(1, (Date.now() - began) / duration);
      const eased = 1 - (1 - progress) ** 3;
      const next = {
        zoom: start.zoom + (target.zoom - start.zoom) * eased,
        center: unproject(
          {
            x: startPoint.x + dx * eased,
            y: startPoint.y + (targetPoint.y - startPoint.y) * eased,
          },
          17,
        ),
      };
      updateCamera(next);
      refreshBuffer(next);
      if (progress < 1) {
        motionFrame.current = requestAnimationFrame(frame);
      } else {
        motionFrame.current = null;
        motionTarget.current = null;
        settleCamera(target);
        if (complete) {
          latest.current.onRegionChangeComplete?.(target.center);
        }
      }
    };
    motionFrame.current = requestAnimationFrame(frame);
  };

  useLayoutEffect(() => {
    renderedCamera.current = camera;
    // Rebase at the camera currently on screen, even if another touch arrived.
    updateCamera(cameraRef.current);
  }, [camera, size.width, size.height, anchor.y]);

  useLayoutEffect(() => {
    if (!sameCenter(center, propCenter.current)) {
      if (!sameCenter(center, cameraRef.current.center)) {
        gesture.current = null;
        // Search and current-location selections glide instead of jumping.
        animateCamera({...cameraRef.current, center});
      }
      propCenter.current = center;
    }
  }, [center]);

  useEffect(() => () => stopMotion(), []);
  const tiles = useMemo(
    () =>
      visibleTiles(
        camera.center,
        camera.zoom,
        size.width,
        size.height,
        size.height ? anchor.y / size.height : anchorRatio,
        TILE_SIZE,
      ),
    [camera, size.width, size.height, anchor.y, anchorRatio],
  );

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: event => {
          if (
            !latest.current.viewport.width ||
            !latest.current.viewport.height
          ) {
            return;
          }
          stopMotion();
          settleCamera(cameraRef.current);
          const native = event.nativeEvent;
          const first = native.touches?.[0] || {};
          const origin = {
            x:
              (native.pageX ?? first.pageX ?? 0) -
              (native.locationX ?? first.locationX ?? 0),
            y:
              (native.pageY ?? first.pageY ?? 0) -
              (native.locationY ?? first.locationY ?? 0),
          };
          const points = eventPoints(event, origin);
          if (!points.length) {
            return;
          }
          gesture.current = {
            origin,
            camera: cameraRef.current,
            points,
            signature: fingerSignature(points),
            moved: false,
            pinched: points.length > 1,
            firstPoint: points[0],
          };
        },
        onPanResponderMove: event => {
          const current = gesture.current;
          if (!current) {
            return;
          }
          const points = eventPoints(event, current.origin);
          if (!points.length) {
            return;
          }
          current.pinched = current.pinched || points.length > 1;
          if (
            !current.moved &&
            (points.length > 1 ||
              Math.hypot(
                points[0].x - current.firstPoint.x,
                points[0].y - current.firstPoint.y,
              ) > 3)
          ) {
            current.moved = true;
            latest.current.onMoveStart?.();
          }
          if (fingerSignature(points) !== current.signature) {
            current.camera = cameraRef.current;
            current.points = points;
            current.signature = fingerSignature(points);
            return;
          }
          if (current.moved) {
            const next = cameraForGesture(
              current.camera,
              current.points,
              points,
              latest.current.viewport,
              freeMaps.minimumZoom,
              freeMaps.maximumZoom,
            );
            updateCamera(next);
            // Refill the nearby buffer only after travelling a tile or zoom level.
            refreshBuffer(next);
          }
        },
        onPanResponderRelease: (event, gestureState) => {
          const current = gesture.current;
          if (!current) {
            return;
          }
          if (!current.moved) {
            const native = event.nativeEvent;
            const x = Number.isFinite(native.locationX)
              ? native.locationX
              : current.firstPoint.x;
            const y = Number.isFinite(native.locationY)
              ? native.locationY
              : current.firstPoint.y;
            const currentViewport = latest.current.viewport;
            const coordinates = tapCoordinates(
              cameraRef.current.center,
              cameraRef.current.zoom,
              x,
              y,
              currentViewport.width,
              currentViewport.height,
              currentViewport.anchor.y / currentViewport.height,
            );
            gesture.current = null;
            latest.current.onMoveStart?.();
            animateCamera({...cameraRef.current, center: coordinates}, true);
            return;
          }
          gesture.current = null;
          if (!current.pinched && current.points.length === 1) {
            const clampVelocity = velocity =>
              Math.max(-1.2, Math.min(1.2, velocity || 0));
            const dx = clampVelocity(gestureState?.vx) * 140;
            const dy = clampVelocity(gestureState?.vy) * 140;
            if (Math.hypot(dx, dy) > 8) {
              animateCamera(
                {
                  ...cameraRef.current,
                  center: panCoordinates(
                    cameraRef.current.center,
                    cameraRef.current.zoom,
                    dx,
                    dy,
                  ),
                },
                true,
                260,
              );
              return;
            }
          }
          settleCamera(cameraRef.current);
          latest.current.onRegionChangeComplete?.(cameraRef.current.center);
        },
        onPanResponderTerminate: () => {
          const current = gesture.current;
          gesture.current = null;
          if (current?.moved) {
            settleCamera(cameraRef.current);
            latest.current.onRegionChangeComplete?.(cameraRef.current.center);
          }
        },
      }),
    [],
  );

  const changeZoom = delta => {
    gesture.current = null;
    latest.current.onMoveStart?.();
    animateCamera(
      {
        ...cameraRef.current,
        zoom: Math.max(
          freeMaps.minimumZoom,
          Math.min(freeMaps.maximumZoom, cameraRef.current.zoom + delta),
        ),
      },
      true,
      240,
    );
  };

  return (
    <View
      style={styles.map}
      testID={testID}
      onLayout={event => {
        const {width, height} = event.nativeEvent.layout;
        if (
          width === latest.current.viewport.width &&
          height === latest.current.viewport.height
        ) {
          return;
        }
        const current = gesture.current;
        const pendingMotion = motionTarget.current;
        stopMotion();
        gesture.current = null;
        settleCamera(cameraRef.current);
        setSize({width, height});
        // Keyboard dismissal must not cancel a search selection halfway there.
        if (pendingMotion) {
          animateCamera(pendingMotion.target, pendingMotion.complete, 200);
        } else if (current?.moved) {
          latest.current.onRegionChangeComplete?.(cameraRef.current.center);
        }
      }}>
      <View style={StyleSheet.absoluteFill} {...responder.panHandlers}>
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: layerOpacity,
              transform: [
                {translateX: translate.x},
                {translateY: translate.y},
                {scale},
              ],
            },
          ]}>
          {tiles.map(tile => (
            <Tile
              key={tile.key}
              tile={tile}
              retry={retry}
              onError={() => setFailed(true)}
            />
          ))}
        </Animated.View>
      </View>
      {size.width > 0 && size.height > 0
        ? renderOverlay?.({anchor, viewport, camera})
        : null}
      {failed ? (
        <Pressable
          style={styles.retry}
          accessibilityRole="button"
          accessibilityLabel="Retry loading map"
          onPress={() => {
            setFailed(false);
            setRetry(value => value + 1);
          }}>
          <Text style={styles.retryText}>Map couldn’t load. Tap to retry.</Text>
        </Pressable>
      ) : null}
      <View style={[styles.controls, {bottom: attributionBottom + 28}]}>
        <Pressable
          style={styles.control}
          onPress={() => changeZoom(1)}
          disabled={zoom >= freeMaps.maximumZoom}
          accessibilityRole="button"
          accessibilityLabel="Zoom in"
          testID="map-zoom-in">
          <MaterialIcons name="add" size={24} color="#3832FF" />
        </Pressable>
        <Pressable
          style={styles.control}
          onPress={() => changeZoom(-1)}
          disabled={zoom <= freeMaps.minimumZoom}
          accessibilityRole="button"
          accessibilityLabel="Zoom out"
          testID="map-zoom-out">
          <MaterialIcons name="remove" size={24} color="#3832FF" />
        </Pressable>
        <Pressable
          style={styles.control}
          onPress={onLocate}
          disabled={locatingDevice}
          accessibilityRole="button"
          accessibilityLabel="Use current location"
          testID="map-current-location">
          <MaterialIcons name="my-location" size={22} color="#3832FF" />
        </Pressable>
      </View>
      <Pressable
        style={[styles.attribution, {bottom: attributionBottom}]}
        accessibilityRole="link"
        accessibilityLabel="OpenStreetMap copyright"
        onPress={() =>
          Linking.openURL(freeMaps.attributionUrl).catch(() => {})
        }>
        <Text style={styles.attributionText}>© OpenStreetMap contributors</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: '#E8EDF1',
  },
  tile: {position: 'absolute', width: TILE_SIZE, height: TILE_SIZE},
  controls: {position: 'absolute', right: 12, gap: 6},
  control: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  attribution: {
    position: 'absolute',
    left: 8,
    paddingHorizontal: 5,
    paddingVertical: 3,
    backgroundColor: '#FFFFFFE6',
    borderRadius: 3,
  },
  attributionText: {fontSize: 10, color: '#364A69'},
  retry: {
    position: 'absolute',
    top: '48%',
    left: 16,
    right: 64,
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  retryText: {fontSize: 12, color: '#48535D', textAlign: 'center'},
});
