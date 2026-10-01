import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  PermissionsAndroid,
  Keyboard,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import {
  responsiveWidth,
  responsiveHeight,
} from 'react-native-responsive-dimensions';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { useDispatch } from 'react-redux';
import { checkAddressExistence, setAddressList, updateUserAddress } from '../../redux/reducers/daddy';
import MapView from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import CustomModal from '../../components/CustomModal';
import { setUserDetails } from '../../redux/reducers/addressSlice';
import commonStyles from '../../commonstyles/CommonStyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';

const AddAddressScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState('Home');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [doorNo, setDoorNo] = useState('');
  const [pincode, setPincode] = useState('');
  const [landmark, setLandmark] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [region, setRegion] = useState({
    latitude: 17.0005,
    longitude: 81.804,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });
  const [markerPosition, setMarkerPosition] = useState({
    latitude: 17.0005,
    longitude: 81.804,
  });
  const mapRef = useRef(null);
  const lastUpdateTime = useRef(Date.now());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const searchTimeout = useRef(null);
  const [areaAvailable, setAreaAvailable] = useState(true)
  const [customModal, setCustomModal] = useState({
    visible: false,
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null,
    confirmText: 'OK',
    cancelText: null,
  });
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const insets = useSafeAreaInsets();

  const showCustomModal = useCallback(
    (
      title,
      message,
      onConfirm,
      onCancel = null,
      confirmText = 'OK',
      cancelText = null,
    ) => {
      setCustomModal({
        visible: true,
        title,
        message,
        onConfirm,
        onCancel,
        confirmText,
        cancelText,
      });
    },
    [],
  );

  const hideCustomModal = useCallback(() => {
    setCustomModal(prev => ({ ...prev, visible: false }));
  }, []);

  const getAddressFromCoordinates = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyBjxoAFhr00pjmZ95SEJYoUL98A6iX8hQ4`,
      );
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const addressComponents = data.results[0].address_components;
        const formattedAddress = data.results[0].formatted_address;

        // Extract address components
        let cityName = '';
        let stateName = '';
        let postalCode = '';

        addressComponents.forEach(component => {
          if (component.types.includes('locality')) {
            cityName = component.long_name;
          }
          if (component.types.includes('administrative_area_level_1')) {
            stateName = component.long_name;
          }
          if (component.types.includes('postal_code')) {
            postalCode = component.long_name;
          }
        });

        setAddress(formattedAddress);
        setCity(cityName);
        setState(stateName);

        // Fill the input fields with the fetched data
        setDoorNo(formattedAddress); // Set the full formatted address
        setPincode(postalCode);
        setLandmark(cityName); // Using city as landmark
      }
    } catch (error) {
      console.error('Error getting address:', error);
      showCustomModal(
        'Error',
        'Failed to get address details. Please try again.',
      );
    }
  };

  const animateToRegion = useCallback(newRegion => {
    mapRef.current?.animateToRegion(newRegion, 1000);
  }, []);

  const onRegionChangeComplete = useCallback(newRegion => {
    const currentTime = Date.now();
    if (currentTime - lastUpdateTime.current > 500) {
      setMarkerPosition({
        latitude: newRegion.latitude,
        longitude: newRegion.longitude,
      });
      setRegion(newRegion);
      getAddressFromCoordinates(newRegion.latitude, newRegion.longitude);
      lastUpdateTime.current = currentTime;
    }
  }, []);

  const requestLocationPermission = useCallback(async () => {
    if (Platform.OS === 'ios') {
      getCurrentLocation();
    } else {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message:
              'This app needs access to your location to provide delivery services.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getCurrentLocation();
        } else {
          showCustomModal(
            'Permission Denied',
            'Location permission is required to use this feature.',
          );
        }
      } catch (err) {
        console.warn(err);
      }
    }
  }, []);

  const getCurrentLocation = useCallback(() => {
    // If we're editing an existing address, show a confirmation modal
    if (route.params?.address) {
      showCustomModal(
        'Update Location',
        'Do you want to update the location of this address?',
        () => {
          fetchCurrentLocation();
        },
        null,
        'Update',
        'Cancel',
      );
      return;
    }
    fetchCurrentLocation();
  }, [route.params?.address]);

  const fetchCurrentLocation = useCallback(() => {
    setIsLoadingLocation(true);
    Geolocation.setRNConfiguration({
      enableHighAccuracy: false,
      timeout: 20000,
      maximumAge: 1000,
    });

    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        const newRegion = {
          latitude,
          longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };

        setMarkerPosition({ latitude, longitude });
        setRegion(newRegion);
        animateToRegion(newRegion);
        getAddressFromCoordinates(latitude, longitude);
        setIsLoadingLocation(false);
      },
      error => {
        let errorMessage = 'Unable to get your location. ';

        switch (error.code) {
          case 1:
            errorMessage +=
              'Please enable location permissions in your device settings.';
            break;
          case 2:
            errorMessage +=
              'Location service is not available. Please check your device settings.';
            break;
          case 3:
            errorMessage +=
              'Request timed out. Please check your internet connection and try again.';
            break;
          case 4:
            errorMessage +=
              'Please check if Google Play services is installed and up to date.';
            break;
          default:
            errorMessage += 'Please try again.';
        }

        setIsLoadingLocation(false);
        showCustomModal(
          'Location Error',
          errorMessage,
          () => fetchCurrentLocation(),
          null,
          'Try Again',
          'Cancel',
        );
      },
      {
        enableHighAccuracy: false,
        timeout: 20000,
        maximumAge: 1000,
      },
    );
  }, [animateToRegion]);

  const onRegionChange = useCallback(newRegion => {
    // Update marker position to match the center of the map
    setMarkerPosition({
      latitude: newRegion.latitude,
      longitude: newRegion.longitude,
    });
    setRegion(newRegion);
  }, []);

  // const onMapPress = useCallback((e) => {

  //   const { latitude, longitude } = e.nativeEvent.coordinate;
  //   const newRegion = {
  //     latitude,
  //     longitude,
  //     latitudeDelta: region.latitudeDelta,
  //     longitudeDelta: region.longitudeDelta,
  //   };

  //   setMarkerPosition({ latitude, longitude });
  //   setRegion(newRegion);
  //   animateToRegion(newRegion);
  // }, [region.latitudeDelta, region.longitudeDelta, animateToRegion]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true); // or some other action
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false); // or some other action
      },
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  const [inputErrors, setInputErrors] = useState({
    name: false,
    contact: false,
    doorNo: false,
    pincode: false,
    landmark: false,
  });
  const validateInputs = useCallback(() => {
    let errors = {
      name: !name,
      contact: !/^[6-9]\d{9}$/.test(contact),
      doorNo: !doorNo,
      pincode: !pincode,
      landmark: !landmark,
    };
    setInputErrors(errors);
    if (errors.name || errors.contact || errors.doorNo || errors.pincode || errors.landmark) {
      showCustomModal('Validation Error', 'All fields are required and must be valid.');
      return false;
    }
    return true;
  }, [name, contact, doorNo, pincode, landmark]);

  const handleSave = useCallback(() => {
    if (validateInputs()) {
      setModalVisible(false);
      addAddress();
      dispatch(
        setUserDetails({
          name: name,
          contact: contact,
          pincode: pincode,
          landmark: landmark,
          city: city,
          state: state,
        }),
      );
    }
  }, [validateInputs]);

  const toggleModal = useCallback(() => {
    setModalVisible(prev => !prev);
  }, []);

  const addAddress = useCallback(async () => {
    setIsSaving(true);
    try {
      const response = await dispatch(
        checkAddressExistence({
          latitude: markerPosition.latitude.toString(),
          longitude: markerPosition.longitude.toString(),
        }),
      );
      if (response?.payload?.data?.length > 0) {
        const addressData = {
          addressType: selectedType,
          address: doorNo,
          location_id: response.payload.data[0].id,
          customer_latitude: markerPosition.latitude.toString(),
          customer_longitude: markerPosition.longitude.toString(),
          customer_name: name,
          customer_mobile_number: contact,
          pincode,
          landmark,
          city,
          state,
          full_address: address,
        };
        if (route.params?.address) {
          console.log('Editing address - ID:', route.params.address.id);
          console.log('Address data being sent:', {
            ...addressData,
            id: route.params.address.id,
          });
          await dispatch(
            setAddressList({
              ...addressData,
              id: route.params.address.id,
            }),
          );
        } else {
          console.log('Creating new address');
          await dispatch(
            setAddressList(addressData),
          );
        }
        navigation.goBack();
      } else {
        setAreaAvailable(false)
      }
    } finally {
      setIsSaving(false);
    }
  }, [dispatch,
    selectedType,
    doorNo,
    markerPosition,
    name,
    contact,
    pincode,
    landmark,
    city,
    state,
    address,
    route.params?.address,
    navigation,
  ]);

  useEffect(() => {
    if (route.params?.address) {
      const address = route.params.address;
      setName(address.customer_name || '');
      setContact(address.customer_mobile_number || '');
      setDoorNo(address.full_address || '');
      setPincode(address.pincode || '');
      setLandmark(address.landmark || '');
      setSelectedType(address.address_type || 'Home');
      setAddress(address.full_address || '');
      setCity(address.city || '');
      setState(address.state || '');

      // Set map position to the address location
      if (address.customer_latitude && address.customer_longitude) {
        const newRegion = {
          latitude: parseFloat(address.customer_latitude),
          longitude: parseFloat(address.customer_longitude),
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };
        setMarkerPosition({
          latitude: parseFloat(address.customer_latitude),
          longitude: parseFloat(address.customer_longitude),
        });
        setRegion(newRegion);
        animateToRegion(newRegion);
      }
    } else {
      // Only get current location if we're adding a new address
      requestLocationPermission();
    }
  }, [route.params]);

  const handleSearch = useCallback(text => {
    setSearchQuery(text);
    setShowResults(true);

    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Set new timeout to avoid too many API calls
    searchTimeout.current = setTimeout(async () => {
      if (text.trim().length > 2) {
        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
              text,
            )}&key=AIzaSyBjxoAFhr00pjmZ95SEJYoUL98A6iX8hQ4`,
          );
          const data = await response.json();

          if (data.status === 'OK') {
            setSearchResults(data.predictions);
          } else {
            setSearchResults([]);
          }
        } catch (error) {
          console.error('Error searching places:', error);
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);
  }, []);

  const handlePlaceSelect = useCallback(
    async placeId => {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,formatted_address&key=AIzaSyBjxoAFhr00pjmZ95SEJYoUL98A6iX8hQ4`,
        );
        const data = await response.json();

        if (data.status === 'OK') {
          const { location } = data.result.geometry;
          const newRegion = {
            latitude: location.lat,
            longitude: location.lng,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          };

          setMarkerPosition({ latitude: location.lat, longitude: location.lng });
          setRegion(newRegion);
          animateToRegion(newRegion);
          getAddressFromCoordinates(location.lat, location.lng);
          setShowResults(false);
          setSearchQuery('');
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Error getting place details:', error);
        showCustomModal(
          'Error',
          'Failed to get place details. Please try again.',
        );
      }
    },
    [animateToRegion],
  );


  // useEffect(()=>{
  //   if(!userDetails) return
  //   setName(userDetails.name)
  //   setContact(userDetails.contact)
  // },[userDetails])
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
          <Text style={styles.title}>
            {route.params?.address ? 'Edit Address' : 'Add Address'}
          </Text>
        {/* </View> */}
      </View>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          region={region}
          onRegionChangeComplete={onRegionChangeComplete}
          showsMyLocationButton={false}
          initialRegion={region}
          moveOnMarkerPress={false}
        />
        <View style={styles.markerOverlay}>
          <View style={styles.markerContainer}>
            <View style={styles.markerTextContainer}>
              <Text style={styles.markerText}>
                Order will be delivered here
              </Text>
              {/* <View style={styles.markerArrow} /> */}
            </View>
            <MaterialIcons name="location-on" size={40} color={commonStyles.appMainColor} />
          </View>
        </View>
        <TouchableOpacity
          style={[
            styles.currentLocationButton,
            isLoadingLocation && styles.currentLocationButtonLoading,
          ]}
          onPress={getCurrentLocation}
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
            selectionColor={commonStyles.appMainColor}
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
            <ScrollView>
              {searchResults.map(result => (
                <TouchableOpacity
                  key={result.place_id}
                  style={styles.searchResultItem}
                  onPress={() => handlePlaceSelect(result.place_id)}>
                  <MaterialIcons name="location-on" size={20} color={commonStyles.appMainColor} />
                  <View style={styles.searchResultText}>
                    <Text style={styles.searchResultMain}>
                      {result.structured_formatting?.main_text ||
                        result.description}
                    </Text>
                    <Text style={styles.searchResultSecondary}>
                      {result.structured_formatting?.secondary_text || ''}
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
            <View style={styles.locationIcon}>
              <MaterialIcons name="location-on" size={24} color={commonStyles.appMainColor} />
            </View>
            <View style={styles.locationDetails}>
              <Text style={styles.locationTitle}>{city || 'Location'}</Text>
              <Text style={styles.locationSubtitle}>
                {address || 'Loading address...'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.addButtonText}>Add More Details</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <Pressable
          activeOpacity={1}
          style={styles.modalContainer}
          onPress={() => {
            setModalVisible(false);
          }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'position'}
            style={styles.keyboardView}>
            <TouchableOpacity
              activeOpacity={1}
              style={styles.modalContentContainer}
              onPress={e => {
                e.stopPropagation();
                toggleModal();
              }}>
              <ScrollView
                contentContainerStyle={{
                  flexGrow: 1,
                  justifyContent: 'flex-end'
                }}>
                <Pressable style={styles.modalContent}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between', padding: 16
                    }}>
                    <View style={{ width: '70%' }}>
                      <Text style={styles.modalTitle}>
                        {city || 'Location'}
                      </Text>
                      <Text style={styles.modalSubtitle}>
                        {address || 'Loading address...'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={toggleModal}
                      style={{ padding: 10, borderRadius: 5 }}>
                      <AntDesign name="close" size={20} color="#666" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.typeButtons}>
                    <FlatList
                      data={['Home', 'Office', 'Work', 'Other']}
                      keyExtractor={item => item}
                      showsHorizontalScrollIndicator={false}
                      horizontal contentContainerStyle={{ paddingHorizontal: 12 }}
                      renderItem={({ item }) => {
                        return (
                          <TouchableOpacity
                            key={item}
                            style={[
                              styles.typeButton,
                              selectedType === item &&
                              styles.selectedTypeButton,
                            ]}
                            onPress={() => setSelectedType(item)}>
                            <Text
                              style={[
                                styles.typeButtonText,
                                selectedType === item &&
                                styles.selectedTypeButtonText,
                              ]}>
                              {item}
                            </Text>
                          </TouchableOpacity>
                        );
                      }}
                    />
                  </View>

                  <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.label}>Name</Text>
                      <Text style={styles.requiredAsterisk}>*</Text>
                    </View>
                    <View style={[styles.inputContainer, inputErrors.name && { borderColor: 'red' }]}>
                      <TextInput
                        placeholder="Name"
                        style={[styles.input,]}
                        value={name}
                        onChangeText={setName}
                        keyboardType="default"
                        placeholderTextColor="#666"
                        maxLength={50}
                        selectionColor={commonStyles.appMainColor}
                      />
                      <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => setName('')}>
                        <AntDesign name="close" size={20} color="#7A7A7A" />
                      </TouchableOpacity>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.label}>Contact number</Text>
                      <Text style={styles.requiredAsterisk}>*</Text>
                    </View>
                    <View style={[styles.inputContainer, inputErrors.contact && { borderColor: 'red' }]}>
                      <TextInput
                        placeholder="Contact Number"
                        style={[styles.input]}
                        value={contact}
                        onChangeText={setContact}
                        keyboardType="phone-pad"
                        placeholderTextColor="#666"
                        maxLength={10}
                        selectionColor={commonStyles.appMainColor}
                      />
                      <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => setContact('')}>
                        <AntDesign name="close" size={20} color="#7A7A7A" />
                      </TouchableOpacity>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.label}>Door no/Flat no/Building</Text>
                      <Text style={styles.requiredAsterisk}>*</Text>
                    </View>
                    <View style={[styles.inputContainer, inputErrors.doorNo && { borderColor: 'red' }]}>
                      <TextInput
                        placeholder="Enter address"
                        placeholderTextColor={'#666'}
                        style={styles.input}
                        value={doorNo}
                        onChangeText={setDoorNo}
                        keyboardType="default"
                        maxLength={100}
                        selectionColor={commonStyles.appMainColor}
                      />
                      <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => setDoorNo('')}>
                        <AntDesign name="close" size={20} color="#7A7A7A" />
                      </TouchableOpacity>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.label}>Pincode</Text>
                      <Text style={styles.requiredAsterisk}>*</Text>
                    </View>
                    {/* <Text style={styles.label}>Pincode</Text> */}
                    <View style={[styles.inputContainer, inputErrors.pincode && { borderColor: 'red' }]}>
                      <TextInput
                        placeholder="Enter pincode"
                        placeholderTextColor={'#666'}
                        style={styles.input}
                        value={pincode}
                        onChangeText={setPincode}
                        keyboardType="number-pad"
                        maxLength={6}
                        selectionColor={commonStyles.appMainColor}
                      />
                      <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => setPincode('')}>
                        <AntDesign name="close" size={20} color="#7A7A7A" />
                      </TouchableOpacity>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.label}>Nearby Landmark</Text>
                      <Text style={styles.requiredAsterisk}>*</Text>
                    </View>

                    {/* <Text style={styles.label}>Nearby Landmark</Text> */}
                    <View style={[styles.inputContainer, inputErrors.landmark && { borderColor: 'red' }]}>
                      <TextInput
                        placeholder="Enter landmark"
                        placeholderTextColor={'#666'}
                        style={styles.input}
                        value={landmark}
                        onChangeText={setLandmark}
                        keyboardType="default"
                        maxLength={100}
                        selectionColor={commonStyles.appMainColor}
                      />
                      <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => setLandmark('')}>
                        <AntDesign name="close" size={20} color="#7A7A7A" />
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={handleSave}>
                      <Text style={styles.saveButtonText}>Save Address</Text>
                    </TouchableOpacity>
                  </View>

                </Pressable>
              </ScrollView>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      <CustomModal
        visible={customModal.visible}
        title={customModal.title}
        message={customModal.message}
        onConfirm={() => {
          if (customModal.onConfirm) {
            customModal.onConfirm();
          }
          hideCustomModal();
        }}
        onCancel={() => {
          if (customModal.onCancel) {
            customModal.onCancel();
          }
          hideCustomModal();
        }}
        confirmText={customModal.confirmText}
        cancelText={customModal.cancelText}
      />

      <CustomModal
        visible={!areaAvailable}
        title={"Location is not available"}
        message={"The selected location is not available for delivery. Please select a different location."}
        onConfirm={() => {
          setAreaAvailable(true)
        }}
        onCancel={() => {
          setAreaAvailable(true)
        }}
        confirmText={"Okay"}
        cancelText=''
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingBottom: 30
  },
  header: {
    // backgroundColor: commonStyles.btn2Color,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(6),
    paddingTop: responsiveHeight(6),
    paddingBottom: 15,
    gap: 10,
    width: '100%',
    flexShrink: 0,
  },
  backButton: {
    width: responsiveWidth(7),
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  markerOverlay: {
    position: 'absolute',
    top: '45%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -40,
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerTextContainer: {
    backgroundColor: commonStyles.appMainColor,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  markerArrow: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    marginLeft: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: commonStyles.appMainColor,
  },
  searchContainer: {
    position: 'absolute',
    top: responsiveHeight(15),
    left: 0,
    right: 0,
    zIndex: 2,
    paddingHorizontal: responsiveWidth(5),
  },
  searchInputContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(3),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  searchIcon: {
    marginRight: responsiveWidth(2),
  },
  searchInput: {
    flex: 1,
    paddingVertical: responsiveHeight(2),
    fontSize: 14,
    color: '#000',
  },
  searchResultsContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 8,
    maxHeight: 200,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 3,
  },
  bottomContainer: {
    backgroundColor: '#fff',
    padding: responsiveWidth(5),
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    // elevation: 8,
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: -4,
    // },
    // shadowOpacity: 0.25,
    // shadowRadius: 4,
    zIndex: 1,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: responsiveHeight(2),
  },
  locationIcon: {
    marginRight: responsiveWidth(3),
    marginTop: 2,
  },
  locationDetails: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  locationSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  currentLocationButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: commonStyles.appMainColor,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    width: 'auto',
  },
  currentLocationButtonLoading: {
    opacity: 0.7,
  },
  currentLocationText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  addButton: {
    backgroundColor: commonStyles.appMainColor,
    borderRadius: 8,
    paddingVertical: responsiveHeight(1.5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  keyboardView: {
    width: '100%',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContentContainer: {
    width: '100%',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    width: '100%',
    minHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    // padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
  },
  typeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  typeButton: {
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#666',
    backgroundColor: '#fff',
    width: responsiveWidth(30),
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: responsiveWidth(1),
  },
  selectedTypeButton: {
    backgroundColor: commonStyles.appMainColor,
  },
  typeButtonText: {
    color: '#666',
    fontWeight: '500',
    fontSize: 16,
  },
  selectedTypeButtonText: {
    color: '#fff',
  },
  label: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 5,
    color: '#525252',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#666',
    borderRadius: 8,
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  input: {
    color: '#000',
    fontWeight: '600',
    flex: 1,
    paddingVertical: 8,
  },
  clearButton: {
    padding: 10,
    borderRadius: 5,
  },
  saveButton: {
    backgroundColor: commonStyles.appMainColor,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff', fontSize: 16,
    fontWeight: '600',
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchResultText: {
    marginLeft: 10,
    flex: 1,
  },
  searchResultMain: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  searchResultSecondary: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 5,
    color: "#525252",
    flexDirection: 'row',
    alignItems: 'center'
  },
  requiredAsterisk: {
    color: 'red',
    marginLeft: 2
  },
});

export default AddAddressScreen;
