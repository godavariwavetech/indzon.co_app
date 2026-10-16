import React, {createContext, forwardRef, useContext} from 'react';
import {
  StyleSheet,
  Text as NativeText,
  TextInput as NativeTextInput,
} from 'react-native';

export const fontFamilies = {
  regular: 'Lato-Regular',
  medium: 'Lato-Medium',
  semibold: 'Lato-SemiBold',
  bold: 'Lato-Bold',
  display: 'DMSerifDisplay-Regular',
};
export const fontSizes = {
  micro: 10,
  navigation: 11,
  caption: 12,
  label: 13,
  body: 14,
  bodyLarge: 14,
  subtitle: 16,
  sectionTitle: 15,
  pageTitle: 18,
  display: 22,
  hero: 26,
  billboard: 30,
};
// Custom app fonts read larger than the reference UI at the same nominal size.
// Scale them consistently here so each screen keeps its hierarchy and spacing.
const CUSTOM_FONT_SCALE = 0.75 * 1.1;
const WeightContext = createContext('400');
const weightFamily = weight => {
  const value =
    weight === 'bold' ? 700 : weight === 'normal' ? 400 : Number(weight);
  return value >= 700
    ? fontFamilies.bold
    : value >= 600
    ? fontFamilies.semibold
    : value >= 500
    ? fontFamilies.medium
    : fontFamilies.regular;
};
function fontStyle(style, inheritedWeight = '400') {
  const resolved = StyleSheet.flatten(style) || {};
  const weight = resolved.fontWeight || inheritedWeight;
  const family =
    resolved.fontFamily === 'display'
      ? fontFamilies.display
      : weightFamily(weight);
  const fontSize =
    typeof resolved.fontSize === 'number' && resolved.fontSize > 1
      ? Math.max(7, Math.round(resolved.fontSize * CUSTOM_FONT_SCALE))
      : resolved.fontSize;
  const lineHeight =
    typeof resolved.lineHeight === 'number'
      ? Math.max(
          fontSize || 7,
          Math.round(resolved.lineHeight * CUSTOM_FONT_SCALE),
        )
      : resolved.lineHeight;
  return {
    weight,
    style: {
      fontFamily: family,
      fontWeight: 'normal',
      includeFontPadding: false,
      ...(fontSize == null ? {} : {fontSize}),
      ...(lineHeight == null ? {} : {lineHeight}),
    },
  };
}

// Explicit wrappers keep app typography independent of device font preferences.
// Nested text retains its parent's weight, and vector-icon fonts remain untouched.
export const Text = forwardRef(function AppText({style, ...props}, ref) {
  const inheritedWeight = useContext(WeightContext);
  const typography = fontStyle(style, inheritedWeight);
  return (
    <WeightContext.Provider value={typography.weight}>
      <NativeText
        {...props}
        ref={ref}
        style={[style, typography.style]}
        allowFontScaling={false}
        maxFontSizeMultiplier={1}
      />
    </WeightContext.Provider>
  );
});
export const TextInput = forwardRef(function AppTextInput(
  {style, ...props},
  ref,
) {
  return (
    <NativeTextInput
      {...props}
      ref={ref}
      style={[style, fontStyle(style).style]}
      allowFontScaling={false}
      maxFontSizeMultiplier={1}
    />
  );
});
