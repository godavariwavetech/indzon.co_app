import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  StatusBar,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import MapView from 'react-native-maps';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { useDispatch, useSelector } from 'react-redux';
import Geolocation from 'react-native-geolocation-service';
import {
  responsiveHeight,
  responsiveWidth,
} from 'react-native-responsive-dimensions';
import { checkAddressExistence, clearCart } from '../../redux/reducers/daddy';
import { useFocusEffect } from '@react-navigation/native';
import CustomModal from '../../components/CustomModal';
import {
  setLocation,
  setLocationName,
  setLocationId,
} from '../../redux/reducers/auth';
import commonStyles from '../../commonstyles/CommonStyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PERMISSIONS, RESULTS, check, request } from 'react-native-permissions';

const DEFAULT_REGION = {
  latitude: 16.9979679,
  longitude: 81.797932,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const SelectServiceFromLocation = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  const dispatch = useDispatch();
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const searchTimeout = useRef(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isCheckingAddress, setIsCheckingAddress] = useState(false);
  const [cartItemsError, setCartItemsError] = useState(false);
  const [locationResponse, setLocationResponse] = useState({});

  const { location: storedLocation, locationId } = useSelector(
    state => state.Auth,
  );
  const { cartItems } = useSelector(state => state.Dashboard);

  const getAddressFromCoordinates = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyBjxoAFhr00pjmZ95SEJYoUL98A6iX8hQ4`,
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const addr = data.results[0].formatted_address;
        const cityComponent = data.results[0].address_components.find(
          component => component.types.includes('locality'),
        );
        setCity(cityComponent?.long_name || '');
        setAddress(addr);
        return addr;
      }
      return 'Address not found';
    } catch (error) {
      console.error('Error getting address:', error);
      return 'Error getting address';
    }
  };

  useEffect(() => {
    const lat = route?.params?.selectedAddress?.customer_latitude;
    const lng = route?.params?.selectedAddress?.customer_longitude;



    // Check if both lat and lng are valid numbers
    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      const newRegion = {
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };

      setRegion(newRegion);
    }
  }, [route?.params?.selectedAddress]);

  const getCurrentLocation = useCallback(async () => {
    setIsLoadingLocation(true);
    try {
      const position = await new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: 10000,
        });
      });

      const newRegion = {
        latitude: parseFloat(position.coords.latitude),
        longitude: parseFloat(position.coords.longitude),
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };

      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
      const currentAddress = await getAddressFromCoordinates(newRegion.latitude, newRegion.longitude);
      dispatch(setLocation(newRegion));
      dispatch(setLocationName(currentAddress));
      dispatch(setLocationId(null));
    } catch (error) {
      console.error('Error getting location:', error);
      setAddress('Unable to retrieve your location. Check location services and permissions.');
    } finally {
      setIsLoadingLocation(false);
    }
  }, [dispatch]);

  const requestLocationPermission = useCallback(async () => {
    try {
      if (Platform.OS === 'android') {
        const status = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location permission',
            message: 'Amaraa uses your location to find available delivery and service areas.',
            buttonPositive: 'Allow',
            buttonNegative: 'Not now',
          },
        );
        if (status === PermissionsAndroid.RESULTS.GRANTED) await getCurrentLocation();
        else setAddress('Allow location access in Settings to use your current location.');
        return;
      }

      const permission = PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
      const currentStatus = await check(permission);
      const status = currentStatus === RESULTS.GRANTED ? currentStatus : await request(permission);
      if (status === RESULTS.GRANTED || status === RESULTS.LIMITED) await getCurrentLocation();
      else setAddress('Allow location access in Settings to use your current location.');
    } catch (error) {
      console.error('Unable to request location permission:', error);
      setAddress('Unable to request location permission. Check your device settings.');
    }
  }, [getCurrentLocation]);

  const handleSearch = useCallback(text => {
    setSearchQuery(text);
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    if (text.length > 0) {
      setShowResults(true);
    } else {
      setShowResults(false);
      setSearchResults([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
            text,
          )}&key=AIzaSyBjxoAFhr00pjmZ95SEJYoUL98A6iX8hQ4&components=country:in`,
        );

        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();

        if (data.status === 'OK') {
          setSearchResults(data.predictions);
        } else {
          setSearchResults([]);

        }
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      }
    }, 500);
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setSearchQuery('');
        setSearchResults([]);
        setShowResults(false);
      };
    }, []),
  );

  const handlePlaceSelect = async placeId => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=AIzaSyBjxoAFhr00pjmZ95SEJYoUL98A6iX8hQ4`,
      );
      const data = await response.json();
      const location = data.result.geometry.location;

      const newRegion = {
        latitude: location.lat,
        longitude: location.lng,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };

      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
      await getAddressFromCoordinates(location.lat, location.lng);
      setSearchQuery('');
      setShowResults(false);
      Keyboard.dismiss();
    } catch (error) {
      console.error('Place details error:', error);
    }
  };
  const handleRegionChange = async newRegion => {
    if (
      newRegion.latitude !== region?.latitude ||
      newRegion.longitude !== region?.longitude
    ) {
      setRegion(newRegion);
      await getAddressFromCoordinates(newRegion.latitude, newRegion.longitude);
    }
  };

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setIsKeyboardVisible(true),
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setIsKeyboardVisible(false),
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleConfirmLocation = async () => {
    try {
      setIsCheckingAddress(true);
      const response = await dispatch(
        checkAddressExistence({
          latitude: parseFloat(region.latitude),
          longitude: parseFloat(region.longitude),
        }),
      );

      if (response.payload?.data?.length > 0) {
        setLocationResponse(response)
        if (response.payload?.data[0].id != locationId && cartItems.length > 0) {
          setCartItemsError(true);
          return;
        }
        dispatch(
          setLocation({
            latitude: parseFloat(region.latitude),
            longitude: parseFloat(region.longitude),
            latitudeDelta: region.latitudeDelta,
            longitudeDelta: region.longitudeDelta,
          }),
        );
        dispatch(setLocationName(response.payload.data[0].location_name));
        dispatch(setLocationId(response.payload.data[0].id));
        navigation.goBack();
      } else {
        setShowServiceModal(true);
      }
    } catch (error) {
      console.error('Location confirmation error:', error);
    } finally {
      setIsCheckingAddress(false);
    }
  };

  useEffect(() => {
    if (storedLocation) {
      const validRegion = {
        latitude: parseFloat(storedLocation.latitude),
        longitude: parseFloat(storedLocation.longitude),
        latitudeDelta:
          storedLocation.latitudeDelta || DEFAULT_REGION.latitudeDelta,
        longitudeDelta:
          storedLocation.longitudeDelta || DEFAULT_REGION.longitudeDelta,
      };
      setRegion(validRegion);
      mapRef.current?.animateToRegion(validRegion, 1000);
      getAddressFromCoordinates(validRegion.latitude, validRegion.longitude);
    }
  }, [getCurrentLocation, storedLocation]);


  const removeCartItems = () => {
    dispatch(clearCart())

    dispatch(
      setLocation({
        latitude: parseFloat(region.latitude),
        longitude: parseFloat(region.longitude),
        latitudeDelta: region.latitudeDelta,
        longitudeDelta: region.longitudeDelta,
      }),
    );
    dispatch(setLocationName(locationResponse.payload.data[0].location_name));
    dispatch(setLocationId(locationResponse.payload.data[0].id));
    navigation.goBack();
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="transparent" barStyle="light-content" translucent />
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: '#D14A00' }]}>
        {/* <View style={styles.header}> */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <FontAwesome6 name="arrow-left-long" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Select Service Location</Text>
        {/* </View> */}
      </View>

      <View style={styles.mapContainer}>
        {region && (
          <MapView
            // key={`map-${region.latitude}-${region.longitude}`}
            ref={mapRef}
            style={styles.map}
            // initialRegion={region}
            region={region}
            onPanDrag={() => setIsDragging(true)}
            onRegionChangeComplete={newRegion => {
              if (isDragging) {
                handleRegionChange(newRegion);
                setIsDragging(false);
              }
            }}
            showsMyLocationButton={false}
            moveOnMarkerPress={false}
          />
        )}
        <View style={styles.markerOverlay}>
          <View style={styles.markerContainer}>
            <MaterialIcons name="location-on" size={40} color={commonStyles.appMainColor} />
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.currentLocationButton,
            isLoadingLocation && styles.currentLocationButtonLoading,
            isKeyboardVisible && { bottom: 20 },
          ]}
          onPress={requestLocationPermission}
          disabled={isLoadingLocation}>
          {isLoadingLocation ? (
            <ActivityIndicator color={commonStyles.appMainColor} size="small" />
          ) : (
            <>
              <MaterialIcons name="my-location" size={24} color={commonStyles.appMainColor} />
              <Text style={styles.currentLocationText}>
                use current location
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <AntDesign
            name="search1"
            size={20}
            color="#666"
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Search for Area/Location"
            style={styles.searchInput}
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setSearchQuery('');
                setSearchResults([]);
                setShowResults(false);
              }}>
              <AntDesign name="close" size={20} color="#7A7A7A" />
            </TouchableOpacity>
          )}
        </View>
        {showResults && searchResults.length > 0 && (
          <View style={styles.searchResultsContainer}>
            <ScrollView keyboardShouldPersistTaps="handled">
              {searchResults.map(result => (
                <TouchableOpacity
                  key={result.place_id}
                  style={styles.searchResultItem}
                  onPress={() => handlePlaceSelect(result.place_id)}>
                  <MaterialIcons name="location-on" size={20} color={commonStyles.appMainColor} />
                  <View style={styles.searchResultText}>
                    <Text style={styles.searchResultMain}>
                      {result.structured_formatting?.main_text}
                    </Text>
                    <Text style={styles.searchResultSecondary}>
                      {result.structured_formatting?.secondary_text}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {!isKeyboardVisible && (
        <View style={styles.bottomContainer}>
          <View style={styles.locationInfo}>
            <MaterialIcons name="location-on" size={24} color={commonStyles.appMainColor} />
            <View style={styles.locationDetails}>
              <Text style={styles.locationTitle}>
                {city || 'Select Location'}
              </Text>
              <Text style={styles.locationSubtitle} numberOfLines={1}>
                {address}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirmLocation}
            disabled={isCheckingAddress}>
            {isCheckingAddress ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.confirmButtonText}>Confirm Location</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <CustomModal
        visible={showServiceModal}
        title="Service Not Available"
        message="We don't serve in this location yet. Please choose another location or select from our service areas."
        onConfirm={() => {
          setShowServiceModal(false);
          navigation.navigate('ServicesAvailable');
        }}
        onCancel={() => setShowServiceModal(false)}
        confirmText="Browse Areas"
        cancelText="Try Again"
      />

      <CustomModal
        visible={cartItemsError}
        title="Switch Location?"
        message="You have items in your cart. Please clear your cart to change the location."
        onConfirm={() => {
          removeCartItems()
        }}
        onCancel={() => setCartItemsError(false)}
        confirmText="Clear Cart"
        cancelText="Cancel"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    // backgroundColor: "#E7432D",
    minHeight: 100,
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    paddingLeft: responsiveWidth(5),
    width: '100%',
    flexShrink: 0,
  },
  backButton: {
    width: responsiveWidth(7),
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 10,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  markerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  markerContainer: {
    marginTop: -40,
    alignItems: 'center',
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 15,
    position: 'absolute',
    right: 20,
    bottom: "30%",
    elevation: 3,
    gap: 8,
    zIndex: 2,
  },
  currentLocationButtonLoading: {
    backgroundColor: '#F0F0F0',
  },
  currentLocationText: {
    color: commonStyles.appMainColor,
    fontSize: 14,
    fontWeight: '500',
  },
  searchContainer: {
    position: 'absolute',
    top: responsiveHeight(15) + 10,
    left: 20,
    right: 20,
    zIndex: 1,
  },
  searchInputContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    elevation: 3,
    borderWidth: 1,
    borderColor: commonStyles.appMainColor,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 5,
  },
  searchResultsContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 5,
    maxHeight: 200,
    elevation: 3,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchResultText: {
    marginLeft: 10,
    flex: 1,
  },
  searchResultMain: {
    fontSize: 14,
    color: '#333',
  },
  searchResultSecondary: {
    fontSize: 12,
    color: '#666',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 5,
    zIndex: 1,
    paddingBottom: 50,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  locationDetails: {
    marginLeft: 10,
    flex: 1,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  locationSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  confirmButton: {
    backgroundColor: commonStyles.appMainColor,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SelectServiceFromLocation;
