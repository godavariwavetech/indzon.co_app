import React from 'react';
import {ActivityIndicator, Pressable, StyleSheet, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {Text} from '../Typography';

// The primary call-to-action used on the Login and OTP screens: blue gradient, 11px corners.
// `style` sizes the button from outside (width, margins, flex); children replace the label
// (e.g. an icon plus text).
export const BUTTON_GRADIENT = ['#4B43FF', '#173CFF'];

export default function GradientButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  style,
  height = 46,
  colors = BUTTON_GRADIENT,
  children,
  testID,
  accessibilityLabel,
}) {
  const unavailable = Boolean(loading || disabled);
  return (
    <Pressable
      onPress={onPress}
      disabled={unavailable}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{disabled: unavailable, busy: Boolean(loading)}}
      testID={testID}
      style={({pressed}) => [
        styles.button,
        style,
        (pressed || unavailable) && styles.dimmed,
      ]}>
      {/* Gradient is its own rounded layer behind the content: iOS ignores the
          parent's overflow clipping for it, which left square corners. */}
      <LinearGradient
        colors={colors}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={styles.fill}
      />
      <View style={[styles.gradient, {minHeight: height}]}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          children || <Text style={styles.label}>{label}</Text>
        )}
      </View>
    </Pressable>
  );
}

export const gradientButtonLabel = {
  fontSize: 14,
  fontWeight: '600',
  color: '#FFFFFF',
};

const styles = StyleSheet.create({
  button: {borderRadius: 11, overflow: 'hidden'},
  fill: {...StyleSheet.absoluteFillObject, borderRadius: 11},
  gradient: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: gradientButtonLabel,
  dimmed: {opacity: 0.65},
});
