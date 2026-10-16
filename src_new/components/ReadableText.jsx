import React, {forwardRef} from 'react';
import {
  Text as NativeText,
  TextInput as NativeTextInput,
  StyleSheet,
} from 'react-native';
// Preserve each screen's fonts while increasing explicit text dimensions by 10%.
function enlarged(style) {
  const value = StyleSheet.flatten(style) || {};
  return {
    ...(typeof value.fontSize === 'number'
      ? {fontSize: value.fontSize * 1.1}
      : {}),
    ...(typeof value.lineHeight === 'number'
      ? {lineHeight: value.lineHeight * 1.1}
      : {}),
  };
}
export const Text = forwardRef(function ReadableText({style, ...props}, ref) {
  return <NativeText {...props} ref={ref} style={[style, enlarged(style)]} />;
});
export const TextInput = forwardRef(function ReadableInput(
  {style, ...props},
  ref,
) {
  return (
    <NativeTextInput {...props} ref={ref} style={[style, enlarged(style)]} />
  );
});
