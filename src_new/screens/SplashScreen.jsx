import {appTheme} from '../config/appTheme';
import React, {useEffect, useRef} from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Image,
  StatusBar,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import {Text} from '../components/ReadableText';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

export default function SplashScreen({onLogoReady}) {
  const {width, height} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const entrance = useRef(new Animated.Value(1)).current;
  const logoSize = Math.min(width * 0.62, height * 0.38, 270);
  useEffect(() => {
    let mounted = true;
    let animation;
    AccessibilityInfo.isReduceMotionEnabled()
      .then(reduced => {
        if (!mounted || reduced) return;
        entrance.setValue(0);
        animation = Animated.timing(entrance, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        });
        animation.start();
      })
      .catch(() => {});
    return () => {
      mounted = false;
      animation?.stop();
    };
  }, [entrance]);
  return (
    <View
      style={[
        styles.root,
        {paddingTop: insets.top, paddingBottom: insets.bottom},
      ]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.main}>
        <Animated.View
          style={[
            styles.brand,
            {
              opacity: entrance.interpolate({
                inputRange: [0, 1],
                outputRange: [0.4, 1],
              }),
              transform: [
                {
                  translateY: entrance.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 0],
                  }),
                },
              ],
            },
          ]}>
          <Image
            source={require('../assets/branding/indzon-logo1.png')}
            onLoadEnd={onLogoReady}
            resizeMode="contain"
            style={{width: logoSize, height: logoSize}}
            accessibilityLabel="INDZON"
          />
          <Text style={styles.tagline}>Your everyday, delivered.</Text>
        </Animated.View>
      </View>
      <View style={styles.footer}>
        <ActivityIndicator
          size="small"
          color={appTheme.primary /* Original: "#3832FF" */}
          accessibilityLabel="Loading INDZON"
        />
        <Text style={styles.loading} accessibilityLiveRegion="polite">
          Getting things ready for you
        </Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#FFFFFF'},
  main: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  brand: {alignItems: 'center'},
  tagline: {
    fontFamily: 'Lato-Regular',
    fontSize: 15,
    lineHeight: 22,
    color: '#697181',
    marginTop: 22,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 30,
    gap: 12,
  },
  loading: {
    fontFamily: 'Lato-Regular',
    fontSize: 12,
    lineHeight: 18,
    color: '#89909E',
    textAlign: 'center',
  },
});
