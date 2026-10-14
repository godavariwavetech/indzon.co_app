import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import FreeMap from '../../components/location/FreeMap';
import DeliveryMapMarker from '../../components/location/DeliveryMapMarker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useDispatch, useSelector} from 'react-redux';
import locationService, {
  validCoordinates,
} from '../../services/locationService';
import LocationButton from '../../components/location/LocationButton';
import AddressDetailsSheet from '../../components/location/AddressDetailsSheet';
import {setDeliveryAddress} from '../../redux/reducers/auth';
import {updateUserAddress} from '../../redux/reducers/daddy';
import {setSelectedAddress} from '../../redux/reducers/addressSlice';

const defaultRegion = {
  latitude: 17.0005,
  longitude: 81.804,
  latitudeDelta: 0.005,
  longitudeDelta: 0.005,
};

export default function AddAddressScreen({navigation, route}) {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const {
    customerId,
    mobileNumber,
    location: authLocation,
  } = useSelector(state => state.Auth);
  const existing = route?.params?.address;
  const initial =
    route?.params?.coordinates ||
    (existing
      ? {
          latitude: Number(existing.customer_latitude),
          longitude: Number(existing.customer_longitude),
        }
      : authLocation);
  const savedPlace =
    existing?.street_address && validCoordinates(initial)
      ? {
          ...initial,
          area: existing.location_name,
          fullAddress: existing.street_address,
          city: existing.city,
          state: existing.state,
          pincode: existing.pincode,
        }
      : null;
  const [region, setRegion] = useState({
    ...defaultRegion,
    ...(validCoordinates(initial) ? initial : {}),
  });
  const [place, setPlace] = useState(savedPlace);
  const startingPlace = useRef(savedPlace);
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(!savedPlace);
  const [error, setError] = useState('');
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [previewHeight, setPreviewHeight] = useState(180);
  const [locatingDevice, setLocatingDevice] = useState(false);
  const geocodeAbort = useRef(null);
  const geocodeVersion = useRef(0);
  const selectionVersion = useRef(0);
  const alive = useRef(true);
  const currentRegion = useRef(region);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const resolveCoordinates = async coordinates => {
    if (!validCoordinates(coordinates)) {
      return;
    }
    const version = ++geocodeVersion.current;
    geocodeAbort.current?.abort();
    geocodeAbort.current = new AbortController();
    setLocating(true);
    setError('');
    try {
      const selected = await locationService.reverseGeocode(
        coordinates,
        geocodeAbort.current.signal,
      );
      if (alive.current && version === geocodeVersion.current) {
        setPlace(selected);
      }
    } catch (err) {
      if (alive.current && version === geocodeVersion.current) {
        setPlace(null);
        setError(
          err.message || 'Could not load this address. Please try again.',
        );
      }
    } finally {
      if (alive.current && version === geocodeVersion.current) {
        setLocating(false);
      }
    }
  };

  useEffect(() => {
    if (!startingPlace.current) {
      resolveCoordinates(currentRegion.current);
    }
    // Resolve the initial pin once; later map moves call resolveCoordinates directly.
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setPredictions([]);
    if (query.trim().length < 3) {
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await locationService.searchPlaces(
          query,
          currentRegion.current,
          controller.signal,
        );
        if (active) {
          setPredictions(results);
          setError(
            results.length
              ? ''
              : 'No locations found. Try a nearby street or area.',
          );
        }
      } catch (err) {
        if (active) {
          setError(err.message);
        }
      } finally {
        if (active) {
          setSearching(false);
        }
      }
    }, 700);
    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const selectPlace = async prediction => {
    const version = ++selectionVersion.current;
    geocodeVersion.current++;
    setLocating(true);
    setPlace(null);
    setError('');
    setPredictions([]);
    setQuery('');
    Keyboard.dismiss();
    try {
      const selected = await locationService.getPlace(prediction);
      if (!alive.current || version !== selectionVersion.current) {
        return;
      }
      const nextRegion = {
        ...defaultRegion,
        latitude: selected.latitude,
        longitude: selected.longitude,
      };
      currentRegion.current = nextRegion;
      setRegion(nextRegion);
      setPlace(selected);
    } catch (err) {
      if (alive.current && version === selectionVersion.current) {
        setError(err.message);
      }
    } finally {
      if (alive.current && version === selectionVersion.current) {
        setLocating(false);
      }
    }
  };

  const movePin = coordinates => {
    selectionVersion.current++;
    currentRegion.current = {...defaultRegion, ...coordinates};
    setRegion(currentRegion.current);
    resolveCoordinates(coordinates);
  };

  const locateDevice = async () => {
    if (locatingDevice) {
      return;
    }
    const version = ++selectionVersion.current;
    setLocatingDevice(true);
    setError('');
    try {
      const coordinates = await locationService.getCurrentLocation();
      if (alive.current && version === selectionVersion.current) {
        movePin(coordinates);
      }
    } catch (err) {
      if (alive.current && version === selectionVersion.current) {
        setError(err.message);
      }
    } finally {
      if (alive.current) {
        setLocatingDevice(false);
      }
    }
  };

  const save = async fields => {
    const address = await locationService.saveAddress(
      customerId,
      fields,
      place,
      existing?.id,
    );
    dispatch(setDeliveryAddress(address));
    dispatch(updateUserAddress(address));
    dispatch(setSelectedAddress(address));
    setDetailsVisible(false);
    if (route?.params?.onboarding) {
      navigation.reset({index: 0, routes: [{name: 'Home'}]});
    } else {
      navigation.goBack();
    }
  };
  return (
    <View style={styles.screen}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <View style={[styles.header, {paddingTop: insets.top + 8}]}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Back">
          <MaterialIcons name="arrow-back" size={26} color="#202427" />
        </Pressable>
        <Text style={styles.title} accessibilityRole="header">
          Add Address
        </Text>
      </View>
      <View style={styles.mapArea}>
        <FreeMap
          center={region}
          anchorRatio={0.5}
          contentBottomInset={previewHeight}
          renderOverlay={({anchor, viewport}) => (
            <DeliveryMapMarker
              anchor={anchor}
              viewport={viewport}
              bottomInset={previewHeight + 6}
            />
          )}
          attributionBottom={previewHeight + 6}
          onMoveStart={() => {
            geocodeVersion.current++;
            selectionVersion.current++;
            geocodeAbort.current?.abort();
            setLocating(true);
          }}
          onRegionChangeComplete={movePin}
          onLocate={locateDevice}
          locatingDevice={locatingDevice}
          testID="address-map"
        />
        <View style={styles.searchContainer}>
          <View style={styles.searchField}>
            <MaterialIcons name="search" size={22} color="#3832FF" />
            <TextInput
              value={query}
              onChangeText={value => {
                selectionVersion.current++;
                setQuery(value);
                setError('');
              }}
              placeholder="Search for Area/Location"
              placeholderTextColor="#929292"
              style={styles.searchInput}
              accessibilityLabel="Search for area or location"
              testID="address-search"
            />
            {searching ? (
              <ActivityIndicator color="#3832FF" />
            ) : query ? (
              <Pressable
                onPress={() => setQuery('')}
                accessibilityRole="button"
                accessibilityLabel="Clear search">
                <MaterialIcons name="close" size={20} color="#929292" />
              </Pressable>
            ) : null}
          </View>
          {predictions.length ? (
            <FlatList
              data={predictions}
              keyExtractor={item => item.place_id}
              keyboardShouldPersistTaps="handled"
              style={styles.results}
              renderItem={({item}) => (
                <Pressable
                  onPress={() => selectPlace(item)}
                  style={styles.result}
                  accessibilityRole="button">
                  <Text style={styles.resultText}>{item.description}</Text>
                </Pressable>
              )}
            />
          ) : null}
        </View>
        <View
          onLayout={event => setPreviewHeight(event.nativeEvent.layout.height)}
          style={[
            styles.preview,
            {paddingBottom: Math.max(insets.bottom, 16)},
          ]}>
          <View style={styles.previewAddress}>
            <MaterialIcons name="location-on" size={28} color="#3832FF" />
            <View style={styles.addressCopy}>
              <Text style={styles.area} numberOfLines={1}>
                {place?.area || 'Select your delivery location'}
              </Text>
              <Text style={styles.address} numberOfLines={2}>
                {locating
                  ? 'Finding address…'
                  : place?.fullAddress ||
                    'Search for an area or move the map pin.'}
              </Text>
            </View>
            {locating ? <ActivityIndicator color="#3832FF" /> : null}
          </View>
          {error ? (
            <Text
              style={styles.error}
              accessibilityRole="alert"
              accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}
          <LocationButton
            label="Add More Details"
            onPress={() => setDetailsVisible(true)}
            disabled={locating || !place || query.trim().length > 0}
            testID="address-more-details"
          />
        </View>
      </View>
      <AddressDetailsSheet
        visible={detailsVisible}
        place={place}
        phoneNumber={mobileNumber}
        existingAddress={existing}
        onClose={() => setDetailsVisible(false)}
        onSave={save}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#FFFFFF'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  title: {fontSize: 20, lineHeight: 27, fontWeight: '700', color: '#202427'},
  mapArea: {flex: 1, backgroundColor: '#EDF0F4'},
  searchContainer: {
    position: 'absolute',
    top: 24,
    left: 16,
    right: 16,
    zIndex: 2,
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#827CFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    minHeight: 46,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 10,
    fontSize: 14,
    color: '#202427',
  },
  results: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    maxHeight: 220,
    marginTop: 4,
    elevation: 4,
  },
  result: {padding: 14, borderBottomWidth: 1, borderBottomColor: '#EEEEEE'},
  resultText: {fontSize: 14, color: '#202427'},
  preview: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  previewAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addressCopy: {flex: 1},
  area: {fontSize: 18, lineHeight: 25, fontWeight: '700', color: '#202427'},
  address: {
    fontSize: 13,
    lineHeight: 19,
    color: '#48535D',
    marginTop: 4,
    minHeight: 38,
  },
  error: {fontSize: 12, lineHeight: 18, color: '#C62828'},
});
