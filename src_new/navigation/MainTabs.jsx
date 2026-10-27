import {Text} from '../components/Typography';
import React, {useEffect, useRef, useState} from 'react';
import {Animated, Keyboard, Pressable, StyleSheet, View} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import StaticHomeScreen from '../screens/home/StaticHomeScreen';
import MainCategoriesScreen from '../screens/main/MainCategoriesScreen';
import MainOrdersScreen from '../screens/main/MainOrdersScreen';
import MainProfileScreen from '../screens/main/MainProfileScreen';
import TabIcon from '../components/main/TabIcon';
import {colors} from '../components/main/MainUi';

const Tab = createBottomTabNavigator();
const labels = {
  HomeTab: ['Home', 'home'],
  CategoriesTab: ['Categories', 'categories'],
  OrdersTab: ['My orders', 'orders'],
  ProfileTab: ['Profile', 'profile'],
};
function AnimatedTabItem({name, focused, color}) {
  const progress = useRef(new Animated.Value(focused ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(progress, {
      toValue: focused ? 1 : 0,
      damping: 15,
      stiffness: 190,
      mass: 0.75,
      useNativeDriver: true,
    }).start();
  }, [focused, progress]);
  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.09],
  });
  const lift = progress.interpolate({inputRange: [0, 1], outputRange: [1, 0]});
  return (
    <View style={styles.icon}>
      <Animated.View
        pointerEvents="none"
        style={[styles.activeLayer, {opacity: progress}]}>
        <LinearGradient colors={['#C7C3FF', '#FFFFFF']} style={styles.active} />
      </Animated.View>
      <Animated.View style={{transform: [{scale}, {translateY: lift}]}}>
        <TabIcon name={name} focused={focused} color={color} />
      </Animated.View>
    </View>
  );
}
function MainTabBar({state, descriptors, navigation}) {
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardVisible(true),
    );
    const hide = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  if (keyboardVisible) {
    return null;
  }
  return (
    <View style={[styles.bar, {paddingBottom: Math.max(insets.bottom, 8)}]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const [label, icon] = labels[route.name];
        const color = focused ? colors.primary : colors.muted;
        return (
          <Pressable
            key={route.key}
            style={styles.tab}
            accessibilityRole="tab"
            accessibilityLabel={
              descriptors[route.key].options.tabBarAccessibilityLabel || label
            }
            accessibilityState={{selected: focused}}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
            onLongPress={() =>
              navigation.emit({type: 'tabLongPress', target: route.key})
            }>
            <AnimatedTabItem name={icon} focused={focused} color={color} />
            <Text
              numberOfLines={1}
              style={[styles.label, {color}, focused && styles.selectedLabel]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <MainTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        tabBarHideOnKeyboard: true,
      }}>
      <Tab.Screen name="HomeTab" component={StaticHomeScreen} />
      <Tab.Screen name="CategoriesTab" component={MainCategoriesScreen} />
      <Tab.Screen name="OrdersTab" component={MainOrdersScreen} />
      <Tab.Screen name="ProfileTab" component={MainProfileScreen} />
    </Tab.Navigator>
  );
}
const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1.3,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.primary,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    elevation: 10,
    shadowColor: '#5A528E',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: -3},
  },
  tab: {flex: 1, alignItems: 'center', paddingBottom: 4},
  icon: {width: 46, height: 42, alignItems: 'center', justifyContent: 'center'},
  active: {
    ...StyleSheet.absoluteFillObject,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderBottomWidth: 1,
    borderColor: '#D8D4FF',
  },
  activeLayer: {...StyleSheet.absoluteFillObject},
  label: {fontSize: 11, lineHeight: 17, paddingTop: 4},
  selectedLabel: {fontWeight: '700'},
});
