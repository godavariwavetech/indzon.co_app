import React from 'react';
import {ActivityIndicator, Pressable, StyleSheet, Text} from 'react-native';
import {authFlowColors as colors} from '../../config/authFlow';

export default function AuthButton({
  label,
  loading,
  disabled,
  onPress,
  testID,
}) {
  const unavailable = Boolean(loading || disabled);
  return (
    <Pressable
      onPress={onPress}
      disabled={unavailable}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{disabled: unavailable, busy: Boolean(loading)}}
      testID={testID}
      style={({pressed}) => [
        styles.button,
        (pressed || unavailable) && styles.dimmed,
      ]}>
      {loading ? (
        <ActivityIndicator color={colors.background} />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  label: {color: colors.background, fontSize: 16, fontWeight: '600'},
  dimmed: {opacity: 0.65},
});
