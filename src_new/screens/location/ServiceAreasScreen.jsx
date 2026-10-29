import {appTheme} from '../../config/appTheme';
import {Text} from '../../components/Typography';
import React, {useEffect, useState} from 'react';
import {Pressable, ScrollView, StatusBar, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useDispatch, useSelector} from 'react-redux';
import locationService from '../../services/locationService';
import {setDeliveryAddress} from '../../redux/reducers/auth';
import {updateUserAddress} from '../../redux/reducers/daddy';
import {setSelectedAddress} from '../../redux/reducers/addressSlice';
import {STATIC_APP_FLOW} from '../../config/appMode';
import {persistorStore, staticPersistor} from '../../redux/store';
import {SkeletonBlock, SkeletonGroup} from '../../components/main/Skeleton';
import GradientButton from '../../components/main/GradientButton';

// Every area we deliver to. Picking one opens the map on that area so the exact position is pinned
// and saved as an address.
export default function ServiceAreasScreen({navigation}) {
  const insets = useSafeAreaInsets();
  const [areas, setAreas] = useState(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [choosing, setChoosing] = useState(false);
  const dispatch = useDispatch();
  const customerId = useSelector(state => state.Auth.customerId);

  useEffect(() => {
    let active = true;
    setAreas(null);
    setError('');
    locationService
      .getServiceAreas()
      .then(rows => active && setAreas(rows))
      .catch(
        () =>
          active && setError('Could not load the service areas. Please retry.'),
      );
    return () => {
      active = false;
    };
  }, [attempt]);

  const choose = async area => {
    if (choosing) {
      return;
    }
    setChoosing(true);
    try {
      // An address already saved in this area is used as is: no form, straight to Home.
      let saved = [];
      try {
        saved = customerId
          ? await locationService.getSavedAddresses(customerId)
          : [];
      } catch {
        saved = [];
      }
      const address = saved.find(
        record => Number(record.location_id) === area.id,
      );
      if (address) {
        dispatch(setDeliveryAddress(address));
        dispatch(updateUserAddress(address));
        dispatch(setSelectedAddress(address));
        await (STATIC_APP_FLOW ? staticPersistor : persistorStore).flush();
        navigation.reset({index: 0, routes: [{name: 'Home'}]});
        return;
      }
      navigation.navigate('AddAddress', {
        coordinates: {latitude: area.latitude, longitude: area.longitude},
        onboarding: true,
      });
    } finally {
      setChoosing(false);
    }
  };

  return (
    <View
      style={[
        styles.screen,
        {paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12},
      ]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.back}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={10}>
          <MaterialIcons name="arrow-back" size={26} color="#111827" />
        </Pressable>
        <Text style={styles.title} accessibilityRole="header">
          Service areas
        </Text>
      </View>
      <Text style={styles.subtitle}>
        Choose where you want your order delivered, then pin your exact
        location.
      </Text>
      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}>
        {areas === null && !error ? (
          <SkeletonGroup style={{gap: 10}}>
            {[0, 1, 2, 3, 4].map(index => (
              <SkeletonBlock
                key={index}
                height={58}
                style={{borderRadius: 14}}
              />
            ))}
          </SkeletonGroup>
        ) : null}
        {error ? (
          <View style={styles.notice} accessibilityRole="alert">
            <MaterialIcons name="info-outline" size={20} color={appTheme.primary /* Original: "#3832FF" */} />
            <Text style={styles.noticeText}>{error}</Text>
          </View>
        ) : null}
        {error ? (
          <GradientButton
            label="Retry"
            onPress={() => setAttempt(value => value + 1)}
            style={{marginTop: 12}}
          />
        ) : null}
        {areas && !areas.length ? (
          <Text style={styles.empty}>
            No service areas are available right now.
          </Text>
        ) : null}
        {(areas || []).map(area => (
          <Pressable
            key={area.id}
            style={[styles.area, choosing && {opacity: 0.6}]}
            disabled={choosing}
            onPress={() => choose(area)}
            accessibilityRole="button"
            accessibilityLabel={`Deliver to ${area.name}`}>
            <View style={styles.pin}>
              <MaterialIcons name="location-on" size={22} color={appTheme.primary /* Original: "#3832FF" */} />
            </View>
            <Text style={styles.areaName}>{area.name}</Text>
            <MaterialIcons name="chevron-right" size={22} color="#9299AA" />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 16},
  header: {flexDirection: 'row', alignItems: 'center', gap: 10, height: 48},
  back: {width: 36, height: 40, justifyContent: 'center'},
  title: {fontSize: 20, fontWeight: '700', color: '#0B0B0B'},
  subtitle: {fontSize: 14, lineHeight: 20, color: '#6B7280', marginTop: 4},
  list: {paddingTop: 18, paddingBottom: 16, gap: 10},
  area: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 58,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: appTheme.surface /* Original: '#F7F8FC' */,
    borderWidth: 1,
    borderColor: appTheme.border /* Original: '#E6E8F2' */,
  },
  pin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: appTheme.tint /* Original: '#EEF0FF' */,
    alignItems: 'center',
    justifyContent: 'center',
  },
  areaName: {flex: 1, fontSize: 15, fontWeight: '600', color: '#202427'},
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: appTheme.tint /* Original: '#EEF0FF' */,
    borderWidth: 1,
    borderColor: appTheme.tintStrong /* Original: '#D6DAFF' */,
  },
  noticeText: {flex: 1, fontSize: 13, lineHeight: 18, color: appTheme.primaryDark /* Original: '#2A2F6B' */},
  empty: {textAlign: 'center', color: '#6B7280', marginTop: 24, fontSize: 14},
});
