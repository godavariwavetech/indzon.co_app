import React, { useCallback, useEffect, useRef, useState, memo } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  FlatList,
  StyleSheet,
  Platform,
  RefreshControl,
  Dimensions,
  Animated
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from 'react-native-responsive-dimensions';
import Clock from './tabassets/Clock';
import { Shadow } from 'react-native-shadow-2';
import ShopSection from './builder/ShopSection';
import { useDispatch, useSelector } from 'react-redux';
import {
  getBanners,
  getCategories,
  getSubCategories,
  setActiveCategoryIndex,
  setsubCategory,
  getAddressList,
  updateUserAddress,
  checkAddressExistence,
  getRestaurantsHome,
} from '../../redux/reducers/daddy';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import Geolocation from '@react-native-community/geolocation';
import { setLocation, setLocationId, setLocationName, setOrderOfferAmount } from '../../redux/reducers/auth';
import ServiceUnavailableScreen from './ServiceUnavailableScreen';
import NetInfo from '@react-native-community/netinfo';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Skeleton from './Skeleton';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import Permissions, { PERMISSIONS, RESULTS, check, request } from 'react-native-permissions';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import StarIcon from './svg/StarIcon';
import commonStyles from '../../commonstyles/CommonStyles';
import { colors } from '../../config/theme';
import { indiviadualShop } from '../../redux/reducers/addressSlice';
import StatusBarManager from '../../components/StatusBarManager';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const screenWidth = Dimensions.get('window').width;
const itemWidth = screenWidth / 6; // since you use numColumns={5}

// Memoized Banner Carousel Component
const BannerCarousel = memo(({ banners, onBannerPress }) => {
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isFocused = useIsFocused();

  useFocusEffect(
    useCallback(() => {
      let intervalId;
      if (isFocused && banners?.length > 0) {
        intervalId = setInterval(() => {
          const newIndex = currentIndex < banners.length - 1 ? currentIndex + 1 : 0;
          flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
          setCurrentIndex(newIndex);
        }, 3000);
      }
      return () => {
        clearInterval(intervalId);
      };
    }, [currentIndex, banners, isFocused])
  );

  const renderBannerItem = useCallback(({ item }) => (
    <TouchableOpacity onPress={() => onBannerPress(item)} style={styles.bannerContainer}>
      <Image
        source={{ uri: item.banner_image }}
        style={styles.bannerImage}
        resizeMode="stretch"
      />
    </TouchableOpacity>
  ), [onBannerPress]);

  const keyExtractor = useCallback((item) => item.id.toString(), []);

  return (
    <FlatList
      ref={flatListRef}
      data={banners}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{}}
      keyExtractor={keyExtractor}
      renderItem={renderBannerItem}
      getItemLayout={(data, index) => ({
        length: responsiveWidth(100),
        offset: responsiveWidth(100) * index,
        index,
      })}
      initialNumToRender={1}
      maxToRenderPerBatch={1}
      windowSize={3}
      removeClippedSubviews={true}
    />
  );
});

// Special Offer Scroller Component
const SpecialOfferScroller = ({ offerText, itemId }) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const [textWidth, setTextWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    // Start animation when both measurements are available
    if (textWidth > 0 && containerWidth > 0) {


      const startAnimation = () => {
        // Start from the right edge of the container
        scrollX.setValue(containerWidth); // Start from right edge
        Animated.loop(
          Animated.timing(scrollX, {
            toValue: -textWidth, // Scroll to the left until text is completely out of view
            duration: 8000,
            useNativeDriver: true,
          })
        ).start();
      };

      // Start animation after a delay
      const timer = setTimeout(startAnimation, 1000);
      return () => clearTimeout(timer);
    }
  }, [textWidth, containerWidth, scrollX]);

  const displayText = offerText || 'Special Offer';
  const marqueeText = `${displayText}`;

  return (
    <LinearGradient
      colors={['#FF6B35', '#F7931E', '#FF8C42']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.specialOfferContainer}
    >
      <View
        style={styles.specialOfferScrollContent}
        onLayout={(event) => {
          const width = event.nativeEvent.layout.width;

          setContainerWidth(width);
        }}
      >
        <Animated.View
          style={[
            styles.specialOfferTextContainer,
            {
              transform: [{ translateX: scrollX }]
            }
          ]}
        >
          <Text
            style={styles.specialOfferText}
            onLayout={(event) => {
              const width = event.nativeEvent.layout.width;

              setTextWidth(width);
            }}
          >
            {marqueeText}
          </Text>
        </Animated.View>
      </View>
    </LinearGradient>
  );
};


export default function UserHome({ navigation }) {
  const { categories, subCategories, banners, restaurants, activeCategoryIndex, loading, addressList, userAddress,
    serviceAvailable, homeRestaurnats } = useSelector(state => state.Dashboard);
  const { locationName } = useSelector(state => state.Auth);
  const { isNetworkConnected } = useSelector(state => state.address);
  const [selectedAddress, setSelectedAddress] = useState(userAddress || "");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubCategoriesExpanded, setIsSubCategoriesExpanded] = useState(false);
  const dispatch = useDispatch();
  const authLocation = useSelector(state => state.Auth.location);
  const [mounted, setMounted] = useState(true);
  const [initialNetLoad, setInitialNetLoad] = useState(false);
  const [serviceCheckFailed, setServiceCheckFailed] = useState(false);
  const [errorOccured, setErrorOccured] = useState(false);
  const networkStatusRef = useRef(isNetworkConnected);
  const numColumns = 6; // or 2, or based on your condition
  const insets = useSafeAreaInsets();



  useEffect(() => {
    networkStatusRef.current = isNetworkConnected;
  }, [isNetworkConnected]);

  // Calculate isLoading from Redux loading states
  const isLoading = (
    loading.addressCheck ||
    isLoadingLocation ||
    loading.categories ||
    loading.banners
  );
  const getAddressFromCoordinates = async (latitude, longitude) => {
    try {
      setErrorOccured(false)
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyBjxoAFhr00pjmZ95SEJYoUL98A6iX8hQ4`,
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
      return 'Address not found';
    } catch (error) {
      console.error('Error getting address:', error);
      setErrorOccured(true);
      return 'Error getting address';
    }
  };

  const getCurrentLocation = useCallback(() => {
    setIsLoadingLocation(true);
    Geolocation.setRNConfiguration({
      enableHighAccuracy: false,
      timeout: 2000,
      maximumAge: 1000,
    });

    Geolocation.getCurrentPosition(
      async position => {
        const { latitude, longitude } = position.coords;
        const address = await getAddressFromCoordinates(latitude, longitude);

        // Update both auth and address list
        dispatch(setLocation({ latitude, longitude }));

        const currentLocationAddress = {
          address_type: userAddress?.address_type || 'Home',
          full_address: address,
          customer_latitude: latitude.toString(),
          customer_longitude: longitude.toString(),
          name: userAddress?.name || '',
          contact: userAddress?.contact || '',
        };

        if (!isNetworkConnected) return

        dispatch(updateUserAddress(currentLocationAddress));
        setSelectedAddress(currentLocationAddress);
        setIsLoadingLocation(false);
      },
      error => {
        console.error('Error getting location:', error);
        setIsLoadingLocation(false);
        networkStatusRef.current && navigation.replace('ServicesAvailable', { permissionDenied: true });
      },
      {
        enableHighAccuracy: false,
        timeout: 20000,
        maximumAge: 1000,
      }
    );
  }, [dispatch, userAddress]);


  const requestLocationPermission = useCallback(async () => {
    try {
      let permission;
      if (Platform.OS === 'ios') {
        permission = PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
      } else if (Platform.OS === 'android') {
        permission = PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
      }
      if (!permission) return;
      const status = await check(permission);
      if (status === RESULTS.GRANTED) {
        getCurrentLocation();
      } else {
        const reqStatus = await request(permission);
        if (reqStatus === RESULTS.GRANTED) {
          getCurrentLocation();
        } else {
          networkStatusRef.current && navigation.replace('ServicesAvailable', { permissionDenied: true });
        }
      }
    } catch (err) {
      networkStatusRef.current && navigation.replace('ServicesAvailable', { permissionDenied: true });
    }
  }, [getCurrentLocation, navigation, isNetworkConnected]);

  const getCategoreis = async () => {
    try {
      setErrorOccured(false)
      dispatch(getCategories());
      dispatch(getSubCategories({ categoryId: activeCategoryIndex }));
      dispatch(getBanners());
      if (!restaurants || restaurants.length === 0) {
        dispatch(getRestaurantsHome({ categoryId: activeCategoryIndex }));
        // dispatch(getRestaurants({categoryId: activeCategoryIndex}));
      }
    } catch (error) {
      setErrorOccured(true)

    }
  };

  useEffect(() => {
    const initializeLocation = async () => {
      if (authLocation) {
        const address = await getAddressFromCoordinates(authLocation.latitude, authLocation.longitude);
        const currentAddress = {
          address_type: locationName,
          full_address: address,
          customer_latitude: authLocation.latitude.toString(),
          customer_longitude: authLocation.longitude.toString(),
        };
        if (!isNetworkConnected) return
        setSelectedAddress(currentAddress);
      } else if (userAddress) {
        setSelectedAddress(userAddress);
      } else {
        requestLocationPermission();
      }
    };

    initializeLocation();
  }, [userAddress, authLocation, requestLocationPermission]);

  useFocusEffect(
    useCallback(() => {
      dispatch(getAddressList());
      // dispatch(getRestaurantsHome({ categoryId: activeCategoryIndex }));
    }, [activeCategoryIndex]),
  );
  useFocusEffect(
    useCallback(() => {
      dispatch(setActiveCategoryIndex(1));
      // dispatch(getRestaurantsHome({ categoryId: activeCategoryIndex }));
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      const checkOnFocus = async () => {
        if (authLocation) {
          await checkServiceAvailability();
        }
      };
      checkOnFocus();
    }, [authLocation])
  );

  const handleSubCategories = category => {
    dispatch(setActiveCategoryIndex(category.id));
    dispatch(getSubCategories({ categoryId: category.id }));
    dispatch(getRestaurantsHome({ categoryId: category.id }));
    dispatch(setOrderOfferAmount(category.order_offer_amount));
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    getCategoreis();
    setRefreshing(false);
    dispatch(setActiveCategoryIndex(1));
  }, []);

  const handleSearch = (text) => {
    setSearchQuery(text);
    navigation.navigate('CategoriesScreen');
  };

  const checkServiceAvailability = async () => {
    const abortController = new AbortController();

    const checkAvailability = async () => {
      if (!authLocation || !mounted) return;

      try {
        setErrorOccured(false)
        const response = await dispatch(checkAddressExistence({
          latitude: authLocation.latitude,
          longitude: authLocation.longitude
        }));

        if (mounted) {
          // Check if service is not available
          // Response structure: response.payload.data array with active_status field
          const payload = response?.payload;

          // Check if no data or empty array
          if (!payload?.data || payload.data.length === 0) {
            // No service location found - navigate to ServicesAvailable screen
            if (networkStatusRef.current) {
              navigation.replace('ServicesAvailable', {
                locationNotAvailable: true,
                latitude: authLocation.latitude,
                longitude: authLocation.longitude
              });
            }
            return;
          }

          // Check if service is not available (active_status === 1 means NOT available)
          const locationData = payload.data[0];
          if (locationData?.active_status === 1) {
            // Service not available at this location - navigate to ServicesAvailable screen
            if (networkStatusRef.current) {
              navigation.replace('ServicesAvailable', {
                locationNotAvailable: true,
                latitude: authLocation.latitude,
                longitude: authLocation.longitude
              });
            }
            return;
          }

          // Service is available (active_status !== 1) - proceed with normal flow
          await dispatch(setLocationName(locationData.location_name));
          await dispatch(setLocationId(locationData.id));

          // Load essential data after service check
          const result = await dispatch(getCategories());
          dispatch(setOrderOfferAmount(result.payload?.data[0]?.order_offer_amount));
          dispatch(getBanners());
          if (!restaurants || restaurants.length === 0) {
            dispatch(getRestaurantsHome({ categoryId: activeCategoryIndex }));
          }
          dispatch(getSubCategories({ categoryId: activeCategoryIndex }));
        }
      } catch (error) {
        setErrorOccured(true)
        if (error.name !== 'AbortError' && mounted) {
          // If service check fails, navigate to ServicesAvailable screen
          if (networkStatusRef.current) {
            navigation.replace('ServicesAvailable', {
              serviceCheckFailed: true,
              latitude: authLocation?.latitude,
              longitude: authLocation?.longitude
            });
          }
        }
      }
    };

    checkAvailability();
    return () => {
      abortController.abort();
      setMounted(false);
    };
  };

  useEffect(() => {
    if (authLocation) {
      checkServiceAvailability();
    }
  }, [authLocation, serviceAvailable]);

  const calculateDeliveryTime = (distance) => {
    if (distance < 3) {
      return '15-20 mins';
    } else if (distance < 5) {
      return '20-30 mins';
    } else {
      return '30-45 mins';
    }
  };

  const handleBannerPress = async (banner) => {
    const resp = await dispatch(indiviadualShop({ shopId: banner?.shop_id }))
    // return
    if (!resp.payload.data[0] || resp.payload.data[0] <= 0) return
    if (banner?.shop_id && banner?.shop_id !== 0) {
      navigation.navigate('BannerRestaurantScreen', {
        shopId: banner?.shop_id,
        shopItem: banner?.item_id,
        highlightItemId: 0
      });
    }

  };

  // Handle network connection changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async state => {
      if (state.isConnected && !isNetworkConnected) {
        // Connection restored - show loading state
        // setRefreshing(true);
        setInitialNetLoad(true)

        await checkServiceAvailability()
        // Refresh all data
        await Promise.all([
          dispatch(getCategories()),
          dispatch(getBanners()),
          dispatch(getRestaurantsHome({ categoryId: activeCategoryIndex })),
          dispatch(getSubCategories({ categoryId: activeCategoryIndex }))
        ]);


        // Small delay to ensure smooth transition
        await new Promise(resolve => setTimeout(resolve, 500));
        // setRefreshing(false);
        setInitialNetLoad(false)
      }
    });
    return () => unsubscribe();
  }, [isNetworkConnected, activeCategoryIndex, dispatch]);


  // const popularRestaurants = homeRestaurnats && homeRestaurnats.filter(restaurant => Number(restaurant.shop_rating) >= 4.5);
  // const nearbyRestaurants = homeRestaurnats && homeRestaurnats.filter(restaurant => Number(restaurant.shop_rating) < 4.5);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => {

        dispatch(setsubCategory(item));
        navigation.navigate('CategorieItems');
      }}
      style={{
        width: itemWidth - 12,  // Adjust for margin
        margin: 5,
        alignItems: "center",
        alignSelf: "flex-start"  // This fixes alignment issue
      }}
    >
      <View style={styles.customCard}>
        <Image
          source={{ uri: item.sub_category_image }}
          style={styles.customImage}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.customLabel} numberOfLines={2}>
        {item.sub_category_name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.mainContainer, { paddingTop: insets.top }]}>
      <StatusBar backgroundColor={"transparent"} translucent barStyle={'dark-content'} />
      <View style={styles.container}>
        {isNetworkConnected === null ? (
          <Skeleton />
        ) : !isNetworkConnected && !categories ? (
          <View style={styles.offlineContainer}>
            <MaterialCommunityIcons name="wifi-off" size={40} color={colors.gray} />
            <Text style={styles.offlineText}>No internet connection available</Text>
            <Text style={styles.offlineSubText}>Please check your network settings</Text>
          </View>
        ) : serviceCheckFailed && !isLoading ? (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={40} color={colors.red} />
            <Text style={styles.errorText}>Network Error</Text>
            <Text style={styles.errorSubText}>Failed to connect to the server</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={checkServiceAvailability}
            >
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : isLoading || initialNetLoad ? (
          <Skeleton />
        ) : serviceAvailable ? (
          <>
            <LinearGradient colors={['#fff', '#fff']} style={styles.gradientContainer}>
              <View style={styles.headerContainer}>
                <View>
                  <TouchableOpacity
                    onPress={() => navigation.navigate("SelectServiceFromLocation", { selectedAddress })}
                    style={styles.locationContainer}
                  >
                    <SimpleLineIcons name="location-pin" color="#000" size={22} />
                    <View>
                      <Text style={styles.locationTitle}>
                        {locationName ? (locationName || 'Current Location') : 'Select Location'}
                      </Text>
                      <Text style={styles.locationAddress} numberOfLines={1}>
                        {selectedAddress?.full_address || 'Tap to choose delivery location'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Notifications')}
                  style={styles.supportButton}
                >
                  <FontAwesome6 name="bell" size={20} color={colors.black} />
                </TouchableOpacity>
              </View>
            </LinearGradient>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[commonStyles.btn2Color]}
                />
              }
              style={styles.container}
            >
              <BannerCarousel
                banners={banners}
                onBannerPress={handleBannerPress}
              />
              <View style={styles.categoryHeaderContainer}>
                <Text style={styles.categoryHeaderTitle}>Category</Text>
                <View style={styles.categoryHeaderLine} />
              </View>
              {categories && (
                <FlatList
                  showsHorizontalScrollIndicator={false}
                  data={categories}
                  style={styles.categoriesList}
                  horizontal
                  contentContainerStyle={[
                    { paddingTop: 5, paddingHorizontal: 10, gap: 10 },
                    categories.length <= 3 && { justifyContent: "space-around", flexGrow: 1 } // ✅ center if <= 3
                  ]}
                  keyExtractor={item => item.id.toString()}
                  renderItem={({ item }) => {
                    return item.id == activeCategoryIndex ? (
                      <TouchableOpacity
                        style={[styles.activeItemTab,]}
                        onPress={() => handleSubCategories(item)}>
                        <Image
                          source={{ uri: item.category_image }}
                          resizeMode="contain"
                          style={[styles.categoryImage,
                          { backgroundColor: "#fff7ec", borderColor: "#F38D33" }]}
                        />
                        <Text numberOfLines={1} style={styles.activeCategoryText}>
                          {item.category_name}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity style={styles.activeItemTab} onPress={() => handleSubCategories(item)}>
                        <Image
                          source={{ uri: item.category_image }}
                          resizeMode="contain"
                          style={[styles.categoryImage, { borderColor: item.id == activeCategoryIndex ? "#F38D33" : '#ddd' }]}
                        />
                        <Text numberOfLines={1} style={styles.inactiveCategoryText}>
                          {item.category_name}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                />
              )}

              <View style={styles.customContainer}>
                <FlatList
                  data={isSubCategoriesExpanded ? subCategories : subCategories?.slice(0, 12)}
                  key={6}
                  numColumns={6}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderItem}
                  scrollEnabled={false}
                />
                {subCategories?.length > 12 && (
                  <TouchableOpacity
                    onPress={() => setIsSubCategoriesExpanded(!isSubCategoriesExpanded)}
                    style={styles.expandButton}
                  >
                    <Text style={styles.expandButtonText}>
                      {isSubCategoriesExpanded ? "Show Less" : "See All"}
                    </Text>
                    <MaterialIcons
                      name={isSubCategoriesExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                      size={20}
                      color={"#F38D33"}
                    />
                  </TouchableOpacity>
                )}
              </View>

              {/* Popular Restaurants */}
              <View style={[commonStyles.row, { paddingHorizontal: 2, marginTop: 5, marginBottom: 10 }]}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#2B2B2B' }}>Popular {activeCategoryIndex === 1 ? "Restaurants" : "Shops"} </Text>
              </View>
              <FlatList
                data={homeRestaurnats}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={() => <View style={{ alignItems: "center", justifyContent: "center", height: responsiveHeight(10), width: responsiveWidth(100) }}>
                  <Text style={{ fontSize: 14, fontWeight: '400', color: '#656565' }}>No popular restaurants/Shops available</Text>
                </View>}
                renderItem={({ item }) => {
                  const isUnavailable = item.shop_active_status === "1";
                  const distance = item.distance;

                  return (
                    <TouchableOpacity
                      style={[styles.restaurantCard, isUnavailable && styles.unavailableCard]}
                      onPress={() => {
                        if (!isUnavailable) {
                          navigation.navigate('RestaurantScreen', {
                            shopId: item.shop_id,
                            shopItem: item.shop_items_tb_nm,
                            item,
                          });
                        }
                      }}
                    >
                      {item.special_offer_status == "1" && (
                        <SpecialOfferScroller
                          offerText={item.special_offer_name}
                          itemId={item.id}
                        />
                      )}
                      <View style={styles.restaurantContent}>
                        {/* Left image */}
                        <View style={styles.restaurantImageContainer}>
                          <Image
                            source={item?.shop_image ? { uri: item.shop_image } : ''}
                            style={styles.restaurantImage}
                          />
                          {/* Heart icon */}
                          {/* <View style={styles.heartIcon}>
                        <MaterialIcons name="favorite" size={28} color="red" />
                        </View> */}

                        </View>
                        {isUnavailable && (
                          <View style={styles.unavailableOverlay}>
                            <Text style={[styles.unavailableText, { color: "red" }]}>Currently Unavailable</Text>
                          </View>
                        )}

                        {/* Right text content */}
                        <View style={styles.restaurantTextContainer}>
                          <Text style={styles.restaurantName}>{item.shop_name}</Text>
                          <View style={styles.ratingRow}>
                            <StarIcon />
                            <Text style={styles.ratingText}>{item.shop_rating}</Text>
                            <Text style={styles.dot}>•</Text>
                            {/* <Text style={styles.deliveryTime}>{calculateDeliveryTime(distance)}</Text> */}
                            <View style={{ flexDirection: "row", gap: 5, alignItems: "center" }}>
                              <Clock />
                              <Text style={{ fontSize: 13, fontWeight: '400', color: '#000' }}>{calculateDeliveryTime(distance)}</Text>
                            </View>
                          </View>
                          {/* <Text numberOfLines={1} style={styles.cuisineText}>{item.cuisines || 'Fried Rice, Chinese, Italian'}</Text> */}
                          <Text style={styles.addressText}>{item.shop_address || 'Tilak Road • 3.0 km'}</Text>

                          {/* Optional Offer Tag */}
                          {item.offer && (
                            <View style={styles.offerTag}>
                              <Text style={styles.offerText}>{item.offer}</Text>
                            </View>
                          )}
                        </View>

                        {/* More menu */}
                        {/* <TouchableOpacity style={styles.menuButton}>
                      <Icon name="more-vert" size={24} color="black" />
                      </TouchableOpacity> */}
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            </ScrollView>
          </>
        ) : serviceAvailable === false ? (
          <ServiceUnavailableScreen />
        )
          : !categories && !errorOccured ? <Skeleton /> :
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Something went wrong</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  checkServiceAvailability();
                  getCategoreis();
                }}
              >
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
            </View>
        }
      </View>
    </View>
  );
}




const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#fff",
    paddingBottom: Platform.OS === 'ios' ? 85 : 60,
  },
  container: {
    flex: 1,
    backgroundColor: colors.white,
    // paddingBottom: 10,
  },
  gradientContainer: {
    // paddingTop: 30
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: responsiveWidth(3),

  },
  categoryHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10
  },
  categoryHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 10,
  },
  categoryHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#CCCCCC',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locationTitle: {
    color: '#000',
    fontSize: 18,
    fontWeight: '700',
  },
  locationAddress: {
    color: '#000',
    fontWeight: '500',
    fontSize: 14,
    width: responsiveWidth(60),
  },
  supportButton: {
    width: 44,
    height: 44,

    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    marginTop: 15,
    backgroundColor: colors.white,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 10,
    marginHorizontal: responsiveWidth(3),
  },
  searchInput: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    flex: 1,
    color: colors.black,
    // fontSize: responsiveFontSize(2),
    // paddingVertical: 6,
    // paddingHorizontal: 8,
  },
  categoriesList: {
    marginTop: 10,
    paddingBottom: 15,
    paddingTop: 10
  },
  activeItemTab: {
    width: responsiveWidth(25),
    height: 90,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor: "orange"
  },
  categoryImage: {
    width: responsiveWidth(25),
    height: 80,
    borderRadius: 10,
    borderWidth: 1.4,
    marginBottom: 5
  },
  activeCategoryText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.black,
    width: responsiveWidth(23),
    textAlign: 'center',
  },
  inactiveCategoryText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.gray,
    width: responsiveWidth(23),
    textAlign: 'center',
  },
  subCategoryShadow: {
    marginHorizontal: 5,
    marginVertical: 10,
  },
  listContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start', // ensures left alignment
    paddingHorizontal: 10,
    paddingTop: 15,
    paddingBottom: 20,
    rowGap: 15, // requires React Native 0.71+
    columnGap: 10, // requires React Native 0.71+
  },
  subCategoryButton: {
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    height: 110,
    width: '30%',       // take ~1/3rd of row
    maxWidth: 120,      // cap it on larger screens
    marginRight: 10,
    marginBottom: 15,
    borderRadius: 8,
  },
  subCategoryImageContainer: {
    width: 100,
    height: 90,
    borderRadius: 30,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: "red"
  },
  subCategoryImage: {
    width: "100%",
    height: "100%",
    borderRadius: 100,
  },
  bannerContainer: {
    width: responsiveWidth(100),
    height: 150,
    paddingHorizontal: 5, // add padding here if needed
    marginVertical: 10,
  },
  bannerImage: {
    width: '100%',  // use 100% of container's width
    height: '100%',
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 15,
    color: '#2B2B2B',
  },

  restaurantImage: {
    width: '100%',
    height: 137,
    borderRadius: 15,
  },
  restaurantInfo: {
    padding: 10,
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: '400',
    color: '#3D3D3D',
  },
  restaurantType: {
    color: '#7A7A7A',
    fontSize: 14,
    fontWeight: '400',
  },
  restaurantStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    gap: 10,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 4,
  },
  statText: {
    color: '#3D3D3D',
    fontSize: 14,
    fontWeight: '500',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 100,
  },

  categoryText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },

  fullScreenLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginHorizontal: 20,
  },
  unavailableCard: {
    opacity: 0.6,
    backgroundColor: '#f0f0f0',
  },
  grayImage: {
    opacity: 0.5,
  },
  unavailableOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    borderRadius: 15,
  },
  unavailableText: {
    color: '#D9534F',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  offlineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  offlineText: {
    fontSize: 18,
    color: '#333',
    marginTop: 10,
    textAlign: 'center',
  },
  offlineSubText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationFallback: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 20,
    alignItems: 'center',
  },
  locationWarning: {
    fontSize: 16,
    color: '#FF4444',
    marginBottom: 15,
    textAlign: 'center',
  },
  locationButton: {
    backgroundColor: '#065E2C',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginVertical: 5,
  },
  locationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  locationOr: {
    color: '#666',
    marginVertical: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '600',
    color: 'grey',
    marginBottom: 20,
  },
  errorSubText: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#065E2C',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  unavailableRestaurant: {
    opacity: 0.7,
  },
  unavailableImage: {
    opacity: 0.5,
  },
  unavailableIcon: {
    marginBottom: 8,
  },
  patternOverlay: {
    position: 'absolute',
    width: '200%',
    height: '200%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    transform: [{ rotate: '-45deg' }],
    zIndex: -1,
  },

  popularCard: {
    width: 212, height: 277, borderRadius: 8, marginRight: 16,
    flex: 1,
    boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.1)',
  },
  popularImgContainer: {
    height: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,

  },
  popularFoodsBottomContainer: {
    flex: 1,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    justifyContent: 'center',
    padding: 10, height: 80,
    backgroundColor: colors.white,

  },
  foodImage: { width: '100%', height: 197, borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  moreText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(101, 101, 101, 0.50)',
    // marginTop:8,
  },
  restaurantCard: {
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.1)',
    padding: 2,
  },

  restaurantContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
    textAlign: "center",

  },

  restaurantImageContainer: {
    width: 110,
    height: 110,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 15,
  },

  restaurantImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  heartIcon: {
    position: 'absolute',
    top: 6,
    right: 6,
  },

  restaurantTextContainer: {
    flex: 1,
    justifyContent: 'center',
    // backgroundColor: "green"
    paddingVertical: 5
  },

  restaurantName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  ratingText: {
    fontSize: 14,
    marginLeft: 4,
    color: '#000',
    fontWeight: '600',
  },

  dot: {
    marginHorizontal: 6,
    fontSize: 14,
    color: '#888',
  },

  deliveryTime: {
    fontSize: 12,
    color: '#000',
  },

  cuisineText: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
  },

  addressText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },

  offerTag: {
    backgroundColor: '#FFF2E5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
    alignSelf: 'flex-start',
  },

  offerText: {
    fontSize: 10,
    color: '#F38D33',
    fontWeight: '600',
  },

  menuButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  customContainer: {
    paddingHorizontal: 8,
    paddingTop: 5,
    backgroundColor: '#fff',
    marginBottom: 10
  },
  customCard: {
    width: itemWidth - 12, // Reduce width slightly for spacing
    height: 50,
    margin: 6,
    paddingVertical: 12,
    backgroundColor: '#fff7ec',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F38D33",
    elevation: 2,
  },
  customImage: {
    width: 40,
    height: 40,
    marginBottom: 4
  },
  customLabel: {
    fontSize: 10,
    textAlign: 'center',
    color: '#000'
  },
  specialOfferContainer: {
    borderRadius: 3,
    paddingHorizontal: 1,
    paddingVertical: 0,
    marginBottom: 5,
    marginTop: 0,
    marginHorizontal: 0,
    overflow: 'hidden', // Hide overflowing text
    shadowColor: '#FF6B35',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#FF8C42',
  },
  specialOfferText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.2,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    whiteSpace: 'nowrap', // Prevent text wrapping
    textTransform: 'uppercase',
  },
  specialOfferScrollContent: {
    paddingHorizontal: 5,
    overflow: 'hidden', // Hide overflowing content
    height: 24, // Increased height for better visibility
    position: 'relative',
    justifyContent: 'center',
  },
  specialOfferTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    left: 0,
    top: 0,
    height: 24,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 5,
    borderTopWidth: 0.5,
    borderTopColor: '#eee',
  },
  expandButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginRight: 4,
  },
});





