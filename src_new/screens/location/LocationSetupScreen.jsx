import {Text} from '../../components/Typography';
import React, {useEffect, useRef, useState} from 'react';
import {
  AccessibilityInfo,
  Animated,
  ActivityIndicator,
  AppState,
  ImageBackground,
  Pressable,
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
  const [areas, setAreas] = useState([]);
  const [choosing, setChoosing] = useState(null);
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
  const loadAreas = async () => {
    try {
      setAreas(await locationService.getServiceAreas());
    } catch {
      setAreas([]);
    }
  };
  const chooseArea = async area => {
    if (choosing) {
      return;
    }
    setChoosing(area.id);
    try {
      const {address} = await locationService.pickAddressForArea({
        customer,
        coordinates: {latitude: area.latitude, longitude: area.longitude},
        area: {id: area.id, name: area.name},
        label: area.name,
      });
      await select(address);
    } catch {
      setChoosing(null);
      setError('Could not select that area. Please try again.');
    }
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
            "We don't deliver to your current location yet. Choose a serviceable area below or pick a place on the map.",
          );
          loadAreas();
          return;
        }
      }
      navigation.navigate('AddAddress', {coordinates, onboarding: true});
    } catch (err) {
      if (version === attempt.current) {
        setError(
          err.message || 'Could not get your location. Please try again.',
        );
        if (liveCustomer) {
          loadAreas();
        }
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
          <Text
            style={styles.error}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}
        {areas.length ? (
          <View style={styles.areas}>
            <Text style={styles.areasLabel}>Serviceable areas</Text>
            {areas.map(area => (
              <Pressable
                key={area.id}
                style={styles.area}
                onPress={() => chooseArea(area)}
                disabled={Boolean(choosing)}
                accessibilityRole="button"
                accessibilityLabel={`Deliver to ${area.name}`}>
                <MaterialIcons name="location-on" size={21} color="#3832FF" />
                <Text style={styles.areaName}>{area.name}</Text>
                {choosing === area.id ? (
                  <ActivityIndicator color="#3832FF" />
                ) : (
                  <MaterialIcons name="chevron-right" size={21} color="#9299AA" />
                )}
              </Pressable>
            ))}
          </View>
        ) : null}
        <View style={styles.actions}>
          <LocationButton
            label="Turn on Device Location"
            onPress={locate}
            loading={loading}
            testID="location-device"
          />
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
  areas: {width: '100%', maxWidth: 480, marginBottom: 16},
  areasLabel: {fontSize: 12, fontWeight: '700', color: '#6B7280', marginBottom: 8},
  area: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 50,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E5F0',
    marginBottom: 8,
  },
  areaName: {flex: 1, fontSize: 15, fontWeight: '600', color: '#202427'},
  error: {
    fontSize: 13,
    lineHeight: 19,
    color: '#C62828',
    marginBottom: 16,
    width: '100%',
    maxWidth: 480,
  },
});
