import {appTheme} from '../../config/appTheme';
import {Text} from '../Typography';
import React from 'react';
import {ActivityIndicator, Pressable, StyleSheet} from 'react-native';
import GradientButton from '../main/GradientButton';

export default function LocationButton({
  label,
  onPress,
  loading,
  disabled,
  secondary,
  testID,
}) {
  const unavailable = loading || disabled;
  if (!secondary) {
    return (
      <GradientButton
        label={label}
        onPress={onPress}
        loading={loading}
        disabled={disabled}
        testID={testID}
      />
    );
  }
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{
        disabled: Boolean(unavailable),
        busy: Boolean(loading),
      }}
      disabled={unavailable}
      onPress={onPress}
      style={({pressed}) => [
        styles.button,
        secondary && styles.secondary,
        (pressed || unavailable) && styles.dimmed,
      ]}>
      {loading ? (
        <ActivityIndicator color={secondary ? appTheme.primary /* Original: '#3832FF' */ : '#FFFFFF'} />
      ) : (
        <Text style={[styles.label, secondary && styles.secondaryLabel]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    backgroundColor: appTheme.primary /* Original: '#3832FF' */,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  label: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    textAlign: 'center',
    color: '#FFFFFF',
  },
  secondary: {
    backgroundColor: appTheme.tint /* Original: '#E5E3FF' */,
    borderWidth: 1,
    borderColor: appTheme.primary /* Original: '#6962FF' */,
    borderStyle: 'dashed',
  },
  secondaryLabel: {color: appTheme.primary /* Original: '#3832FF' */, fontSize: 13},
  dimmed: {opacity: 0.6},
});
