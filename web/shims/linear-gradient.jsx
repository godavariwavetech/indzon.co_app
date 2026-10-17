// react-native-linear-gradient -> CSS linear-gradient.
import React from 'react';
import {View} from 'react-native';

export default function LinearGradient({
  colors = [],
  locations,
  start = {x: 0.5, y: 0},
  end = {x: 0.5, y: 1},
  style,
  children,
  ...rest
}) {
  const dx = (end.x ?? 0.5) - (start.x ?? 0.5);
  const dy = (end.y ?? 1) - (start.y ?? 0);
  // CSS angles: 0deg points up, 90deg points right.
  const angle = (Math.atan2(dx, -dy) * 180) / Math.PI;
  const stops = colors
    .map((color, i) =>
      locations?.[i] != null ? `${color} ${locations[i] * 100}%` : color,
    )
    .join(', ');
  return (
    <View
      {...rest}
      style={[
        style,
        {backgroundImage: `linear-gradient(${angle}deg, ${stops})`},
      ]}>
      {children}
    </View>
  );
}
