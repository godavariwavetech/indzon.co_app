import {appTheme} from '../../config/appTheme';
import {fontSizes, Text, TextInput} from '../Typography';
import React, {createContext, useCallback, useContext, useState} from 'react';
import {
  InteractionManager,
  Pressable,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';

export const colors = {
  primary: appTheme.primary /* Original: '#3832FF' */,
  ink: '#202427',
  muted: '#7B8294',
  border: appTheme.border /* Original: '#E5E8F1' */,
};
const PageReadyContext = createContext(false);

export function usePageReady() {
  return useContext(PageReadyContext);
}

export function Page({children, style}) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [ready, setReady] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setReady(false);
      const task = InteractionManager.runAfterInteractions(() => {
        setReady(true);
      });
      return () => {
        task.cancel();
        setReady(false);
      };
    }, [navigation]),
  );
  return (
    <PageReadyContext.Provider value={ready}>
      <View style={[ui.page, {paddingTop: insets.top}, style]}>
        <LinearGradient
          pointerEvents="none"
          colors={[appTheme.tintStrong /* Original: '#CDCAFF' */, '#FFFFFF']}
          style={{position: 'absolute', top: 0, left: 0, right: 0, height: insets.top + 180}}
        />
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent
        />
        {children}
      </View>
    </PageReadyContext.Provider>
  );
}
export function Heading({title, navigation, back = false, right, titleStyle}) {
  return (
    <View style={ui.heading}>
      {back ? (
        <Pressable
          onPress={() =>
            navigation.canGoBack()
              ? navigation.goBack()
              : navigation.navigate('Home')
          }
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={10}>
          <MaterialIcons name="arrow-back" size={26} color={colors.ink} />
        </Pressable>
      ) : null}
      <Text style={[ui.title, titleStyle]} accessibilityRole="header">
        {title}
      </Text>
      {right}
    </View>
  );
}
export function SearchField({
  value,
  onChangeText,
  placeholder = 'Search here',
  style,
  onPress,
}) {
  if (onPress) {
    return (
      <Pressable
        style={[ui.search, style]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={placeholder}
        testID="open-search-screen">
        <MaterialIcons name="search" size={24} color={colors.primary} />
        <Text style={ui.searchInput} numberOfLines={1}>
          {placeholder}
        </Text>
      </Pressable>
    );
  }
  return (
    <View style={[ui.search, style]}>
      <MaterialIcons name="search" size={24} color={colors.primary} />
      <TextInput
        style={ui.searchInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#929292"
        accessibilityLabel={placeholder}
        returnKeyType="search"
      />
      {value ? (
        <Pressable
          onPress={() => onChangeText('')}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={8}>
          <MaterialIcons name="close" size={19} color={colors.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}
export function EmptyState({message}) {
  return <Text style={ui.empty}>{message}</Text>;
}
export function Footer({children, style}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        {
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 16),
          flexDirection: 'row',
          gap: 10,
          borderTopWidth: 1,
          borderColor: colors.border,
        },
        style,
      ]}>
      {children}
    </View>
  );
}
export const ui = StyleSheet.create({
  page: {flex: 1, backgroundColor: '#FFFFFF'},
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    flex: 1,
    fontSize: fontSizes.pageTitle,
    lineHeight: 23,
    fontWeight: '700',
    color: colors.ink,
  },
  search: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: appTheme.primaryLight /* Original: '#827CFF' */,
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  searchInput: {flex: 1, color: colors.ink, paddingVertical: 10, fontSize: 14},
  empty: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.muted,
    textAlign: 'center',
    padding: 24,
  },
  sectionTitle: {
    fontSize: fontSizes.sectionTitle,
    lineHeight: 20,
    fontWeight: '700',
    color: colors.ink,
  },
  action: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  actionText: {fontSize: 16, fontWeight: '700', color: '#FFFFFF'},
});
