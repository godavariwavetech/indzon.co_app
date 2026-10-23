import React from 'react';
import GradientButton from '../main/GradientButton';

export default function AuthButton({label, loading, disabled, onPress, testID}) {
  return (
    <GradientButton
      label={label}
      loading={loading}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
    />
  );
}
