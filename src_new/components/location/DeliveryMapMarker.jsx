import {appTheme} from '../../config/appTheme';
import {Text} from '../Typography';
import React from 'react';
import {StyleSheet, View} from 'react-native';
import Svg, {Circle, Path} from 'react-native-svg';

const markerWidth = 30;
const markerHeight = 36;

export default function DeliveryMapMarker({anchor, viewport, bottomInset = 0}) {
  const calloutWidth = Math.min(240, viewport.width * 0.68);
  // Keep the centered pin visible on short maps without covering the search box.
  const showCallout = viewport.height - bottomInset >= 200 && anchor.y >= 200;
  return (
    <View
      pointerEvents="none"
      style={[styles.anchor, {left: anchor.x, top: anchor.y}]}>
      <View style={styles.marker}>
        <Svg width={markerWidth} height={markerHeight} viewBox="0 0 32 40">
          <Path
            d="M16 0C7.2 0 0 7.2 0 16c0 10 16 24 16 24s16-14 16-24C32 7.2 24.8 0 16 0Z"
            fill={appTheme.primary /* Original: "#3832FF" */}
          />
          <Circle cx={16} cy={16} r={8} fill="#FFFFFF" />
          <Circle cx={16} cy={16} r={4} fill={appTheme.primary /* Original: "#3832FF" */} />
        </Svg>
      </View>
      {showCallout ? (
        <View
          style={[
            styles.callout,
            {left: -calloutWidth / 2, width: calloutWidth},
          ]}>
          <Text style={styles.title}>Your order will be delivered here</Text>
          <Text style={styles.subtitle}>Move pin to your exact location</Text>
          <View style={styles.triangle} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {position: 'absolute', width: 0, height: 0},
  marker: {
    position: 'absolute',
    left: -markerWidth / 2,
    top: -markerHeight,
    width: markerWidth,
    height: markerHeight,
  },
  callout: {
    position: 'absolute',
    bottom: markerHeight + 14,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: '#686868',
    borderRadius: 4,
    alignItems: 'center',
  },
  title: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
    color: '#D5D5D5',
    textAlign: 'center',
    marginTop: 2,
  },
  triangle: {
    position: 'absolute',
    bottom: -7,
    borderTopWidth: 8,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopColor: '#686868',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});
