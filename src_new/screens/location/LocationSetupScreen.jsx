import {Text} from '../../components/Typography';
import React, {useEffect, useRef, useState} from 'react';
import {
  AccessibilityInfo,
  Animated,
  AppState,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import {useIsFocused} from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LocationButton from '../../components/location/LocationButton';
import locationService from '../../services/locationService';

export default function LocationSetupScreen({navigation}) {
  const insets = useSafeAreaInsets();
  const {width, height} = useWindowDimensions();
  const focused = useIsFocused();
  const motion = useRef(new Animated.Value(0)).current;
  const illustrationHeight = Math.min(width * 0.8, height * 0.34, 310);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const attempt = useRef(0);
  useEffect(() => {
    let alive = true;
    let reduced = true;
    let animation;
    const update = () => {
      animation?.stop();
      motion.setValue(0);
      if (!alive || !focused || reduced || AppState.currentState !== 'active')
        return;
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(motion, {
            toValue: 1,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(motion, {
            toValue: 0,
            duration: 1800,
            useNativeDriver: true,
          }),
        ]),
      );
      animation.start();
    };
    AccessibilityInfo.isReduceMotionEnabled()
      .then(value => {
        if (!alive) return;
        reduced = value;
        update();
      })
      .catch(() => {});
    const reduceSubscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      value => {
        reduced = value;
        update();
      },
    );
    const appSubscription = AppState.addEventListener('change', update);
    return () => {
      alive = false;
      animation?.stop();
      reduceSubscription.remove();
      appSubscription.remove();
    };
  }, [focused, motion]);
  useEffect(
    () => () => {
      attempt.current++;
    },
    [],
  );
  const locate = async () => {
    if (busy.current) {
      return;
    }
    busy.current = true;
    const version = ++attempt.current;
    setLoading(true);
    setError('');
    try {
      const coordinates = await locationService.getCurrentLocation();
      if (version === attempt.current) {
        navigation.navigate('AddAddress', {coordinates, onboarding: true});
      }
    } catch (err) {
      if (version === attempt.current) {
        setError(
          err.message || 'Could not get your location. Please try again.',
        );
      }
    } finally {
      if (version === attempt.current) {
        busy.current = false;
        setLoading(false);
      }
    }
  };
  return (
    <View style={styles.screen}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 22,
            paddingBottom: Math.max(insets.bottom, 20),
          },
        ]}>
        <View style={styles.eyebrow}>
          <MaterialIcons name="near-me" size={17} color="#3832FF" />
          <Text style={styles.eyebrowText}>LET'S GET YOU SET UP</Text>
        </View>
        <Text style={styles.title} accessibilityRole="header">
          Where should we deliver?
        </Text>
        <Text style={styles.subtitle}>
          Set your location to discover nearby stores and get your essentials
          delivered to the right door.
        </Text>
        <View style={[styles.illustration, {height: illustrationHeight}]}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.halo,
              {
                width: illustrationHeight * 0.85,
                height: illustrationHeight * 0.85,
                opacity: motion.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.6, 0.25],
                }),
                transform: [
                  {
                    scale: motion.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1.12],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.Image
            source={require('../../assets/location/delivery-location.png')}
            resizeMode="contain"
            style={[
              styles.artwork,
              {
                height: illustrationHeight - 16,
                transform: [
                  {
                    translateY: motion.interpolate({
                      inputRange: [0, 1],
                      outputRange: [4, -5],
                    }),
                  },
                ],
              },
            ]}
            accessible={false}
          />
        </View>
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <MaterialIcons name="place" size={23} color="#3832FF" />
          </View>
          <View style={styles.infoCopy}>
            <Text style={styles.infoTitle}>Find your delivery spot</Text>
            <Text style={styles.infoBody}>
              Use your current location, then confirm the pin and add your
              address details.
            </Text>
          </View>
        </View>
        {error ? (
          <Text
            style={styles.error}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}
        <View style={styles.actions}>
          <LocationButton
            label="Use my current location"
            onPress={locate}
            loading={loading}
            testID="location-device"
          />
          <LocationButton
            label="Enter address manually"
            secondary
            onPress={() => {
              attempt.current++;
              busy.current = false;
              setLoading(false);
              setError('');
              navigation.navigate('AddAddress', {onboarding: true});
            }}
            testID="location-manual"
          />
        </View>
        <View style={styles.reassurance}>
          <MaterialIcons name="edit-location-alt" size={16} color="#7C8393" />
          <Text style={styles.reassuranceText}>
            You can change your delivery address anytime.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#FFFFFF'},
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 14,
  },
  eyebrowText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#3832FF',
  },
  title: {
    width: '100%',
    maxWidth: 480,
    fontSize: 31,
    lineHeight: 39,
    textAlign: 'center',
    fontWeight: '700',
    color: '#202427',
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 25,
    textAlign: 'center',
    color: '#737B8C',
    maxWidth: 370,
    marginTop: 12,
  },
  illustration: {
    width: '100%',
    maxWidth: 430,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  halo: {position: 'absolute', backgroundColor: '#E9E6FF', borderRadius: 200},
  artwork: {width: '100%', maxWidth: 400},
  infoCard: {
    width: '100%',
    maxWidth: 480,
    padding: 15,
    flexDirection: 'row',
    gap: 12,
    borderRadius: 16,
    backgroundColor: '#F5F4FF',
    borderWidth: 1,
    borderColor: '#ECE9FF',
    marginBottom: 22,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAE7FF',
  },
  infoCopy: {flex: 1},
  infoTitle: {fontSize: 18, fontWeight: '700', color: '#29263F'},
  infoBody: {fontSize: 15, lineHeight: 22, color: '#737086', marginTop: 5},
  actions: {width: '100%', maxWidth: 480, gap: 12},
  reassurance: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 18,
    marginBottom: 10,
    maxWidth: 480,
  },
  reassuranceText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#7C8393',
    flexShrink: 1,
  },
  error: {
    fontSize: 13,
    lineHeight: 19,
    color: '#C62828',
    marginBottom: 16,
    width: '100%',
    maxWidth: 480,
  },
});
