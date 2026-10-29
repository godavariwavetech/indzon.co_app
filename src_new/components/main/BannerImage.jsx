import {appTheme} from '../../config/appTheme';
import React from 'react';
import {Image, StyleSheet, View} from 'react-native';

// Draws a banner in a slot of a fixed shape without cutting any of it off. A dashboard
// banner can be any shape (2:1, 3:1, 1.6:1...); `cover` would crop its text, so the whole
// picture is shown (`contain`) over a blurred copy of itself that fills the rest of the
// slot. A bundled banner already has the slot's shape and is drawn straight.
export default function BannerImage({source, style, accessibilityLabel}) {
  if (typeof source === 'number') {
    return (
      <Image
        source={source}
        resizeMode="cover"
        accessibilityLabel={accessibilityLabel}
        style={style}
      />
    );
  }
  return (
    <View style={[style, styles.frame]} accessibilityLabel={accessibilityLabel}>
      <Image
        source={source}
        blurRadius={18}
        resizeMode="cover"
        accessible={false}
        style={StyleSheet.absoluteFill}
      />
      <Image
        source={source}
        resizeMode="contain"
        accessible={false}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {overflow: 'hidden', backgroundColor: appTheme.tint /* Original: '#EAF1FC' */},
});
