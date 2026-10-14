import React, {useEffect, useRef, useState} from 'react';
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LocationButton from '../../components/location/LocationButton';
import locationService from '../../services/locationService';

export default function LocationSetupScreen({navigation}) {
  const insets = useSafeAreaInsets();
  const {width} = useWindowDimensions();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const attempt = useRef(0);
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
            paddingTop: insets.top + 30,
            paddingBottom: Math.max(insets.bottom, 20),
          },
        ]}>
        <Text style={styles.title} accessibilityRole="header">
          Set your location to explore nearby food and enjoy faster, accurate
          food delivery
        </Text>
        <Image
          source={require('../../assets/location/location-choice.png')}
          resizeMode="contain"
          style={[styles.artwork, {height: Math.min(width - 36, 460) * 0.9}]}
          accessible={false}
        />
        <View style={styles.spacer} />
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
            label="TURN ON DEVICE LOCATION"
            onPress={locate}
            loading={loading}
            testID="location-device"
          />
          <LocationButton
            label="ENTER DELIVERY LOCATION MANUALLY"
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#FFFFFF'},
  content: {flexGrow: 1, alignItems: 'center', paddingHorizontal: 16},
  title: {
    width: '100%',
    maxWidth: 480,
    paddingHorizontal: 14,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: '#202427',
  },
  artwork: {width: '100%', maxWidth: 460, marginTop: 32},
  spacer: {flexGrow: 1, minHeight: 30},
  actions: {width: '100%', maxWidth: 480, gap: 18, marginBottom: 30},
  error: {
    fontSize: 13,
    lineHeight: 19,
    color: '#C62828',
    marginBottom: 16,
    width: '100%',
    maxWidth: 480,
  },
});
