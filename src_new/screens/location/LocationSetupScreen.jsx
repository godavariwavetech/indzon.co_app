import {Text} from '../../components/Typography';
import React, {useEffect, useRef, useState} from 'react';
import {
  AccessibilityInfo,
  Animated,
  AppState,
  ImageBackground,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import {useIsFocused} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LocationButton from '../../components/location/LocationButton';
import locationService from '../../services/locationService';
import {setDeliveryAddress} from '../../redux/reducers/auth';
import {updateUserAddress} from '../../redux/reducers/daddy';
import {setSelectedAddress} from '../../redux/reducers/addressSlice';
import {ENABLE_LIVE_DATA, STATIC_APP_FLOW} from '../../config/appMode';
import {persistorStore, staticPersistor} from '../../redux/store';

export default function LocationSetupScreen({navigation}) {
  const insets = useSafeAreaInsets();
  const {width, height} = useWindowDimensions();
  const focused = useIsFocused();
  const motion = useRef(new Animated.Value(0)).current;
  const illustrationHeight = Math.min(width * 0.8, height * 0.34, 310);
  const dispatch = useDispatch();
  const {customerId, customerName, mobileNumber} = useSelector(
    state => state.Auth,
  );
  const liveCustomer = Boolean(ENABLE_LIVE_DATA && customerId);
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
  const customer = {customerId, name: customerName, mobileNumber};
  // Makes the address the delivery address and enters the app.
  const select = async address => {
    dispatch(setDeliveryAddress(address));
    dispatch(updateUserAddress(address));
    dispatch(setSelectedAddress(address));
    await (STATIC_APP_FLOW ? staticPersistor : persistorStore).flush();
    navigation.reset({index: 0, routes: [{name: 'Home'}]});
  };
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
      if (version !== attempt.current) {
        return;
      }
      if (liveCustomer) {
        // undefined = could not check (offline), null = outside our delivery areas.
        let area;
        try {
          area = await locationService.findServiceArea(coordinates);
        } catch {
          area = undefined;
        }
        if (version !== attempt.current) {
          return;
        }
        if (area) {
          const {address} = await locationService.pickAddressForArea({
            customer,
            coordinates,
            area,
          });
          await select(address);
          return;
        }
        if (area === null) {
          setError(
            "We don't deliver to your current location yet. Choose one of our service areas or pick a place on the map.",
          );
          return;
        }
      }
      navigation.navigate('AddAddress', {coordinates, onboarding: true});
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
  // Pick the delivery address straight after login instead of asking for it every time.
  useEffect(() => {
    if (liveCustomer) {
      locate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <ImageBackground
      source={require('../../assets/location/location-background.png')}
      resizeMode="cover"
      style={styles.screen}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + height * 0.12,
            paddingBottom: Math.max(insets.bottom, 20),
          },
        ]}>
        <Text style={styles.title} accessibilityRole="header">
          Set your location to explore nearby food and enjoy faster, accurate
          food delivery
        </Text>
        <View style={[styles.illustration, {height: illustrationHeight}]}>
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
        <View style={styles.spacer} />
        {error ? (
          <View
            style={styles.error}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite">
            <MaterialIcons name="info-outline" size={20} color="#3832FF" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        <View style={styles.actions}>
          <LocationButton
            label="Turn on Device Location"
            onPress={locate}
            loading={loading}
            testID="location-device"
          />
          {liveCustomer ? (
            <LocationButton
              label="Choose Service Area"
              secondary
              onPress={() => navigation.navigate('ServiceAreas')}
              testID="location-areas"
            />
          ) : null}
          <LocationButton
            label="Enter Delivery Location Manually"
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
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#F4F6FF'},
  content: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    width: '100%',
    maxWidth: 480,
    fontSize: 29,
    lineHeight: 36,
    textAlign: 'center',
    fontWeight: '700',
    fontFamily: 'display',
    color: '#0B0B0B',
  },
  illustration: {
    width: '100%',
    maxWidth: 430,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  artwork: {width: '100%', maxWidth: 400},
  spacer: {flexGrow: 1, minHeight: 24},
  actions: {width: '100%', maxWidth: 480, gap: 14},
  error: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#EEF0FF',
    borderWidth: 1,
    borderColor: '#D6DAFF',
    marginBottom: 16,
    width: '100%',
    maxWidth: 480,
  },
  errorText: {flex: 1, fontSize: 13, lineHeight: 19, color: '#2A2F6B'},
});
