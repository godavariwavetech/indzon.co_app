import React, { useCallback, useEffect, useRef, useState, memo, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StatusBar,
  FlatList,
  StyleSheet,
  Platform,
  RefreshControl,
  Dimensions,
  Animated
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  responsiveHeight,
  responsiveWidth,
} from 'react-native-responsive-dimensions';
import Clock from './tabassets/Clock';
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
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import Feather from 'react-native-vector-icons/Feather';
import Permissions, { PERMISSIONS, RESULTS, check, request } from 'react-native-permissions';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import StarIcon from './svg/StarIcon';
import commonStyles from '../../commonstyles/CommonStyles';
import { colors } from '../../config/theme';
import { indiviadualShop } from '../../redux/reducers/addressSlice';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Skeleton from './Skeleton';

const screenWidth = Dimensions.get('window').width;
const itemWidth = screenWidth / 6;

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

  return (
    <FlatList
      ref={flatListRef}
      data={banners}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item) => item.id.toString()}
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
const SpecialOfferScroller = memo(({ offerText }) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const [textWidth, setTextWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (textWidth > 0 && containerWidth > 0) {
      const startAnimation = () => {
        scrollX.setValue(containerWidth);
        Animated.loop(
          Animated.timing(scrollX, {
            toValue: -textWidth,
            duration: 8000,
            useNativeDriver: true,
          })
        ).start();
      };
      const timer = setTimeout(startAnimation, 1000);
      return () => clearTimeout(timer);
    }
  }, [textWidth, containerWidth, scrollX]);

  return (
    <LinearGradient
      colors={['#FF6B35', '#F7931E', '#FF8C42']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.specialOfferContainer}
    >
      <View
        style={styles.specialOfferScrollContent}
        onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
      >
        <Animated.View style={[styles.specialOfferTextContainer, { transform: [{ translateX: scrollX }] }]}>
          <Text style={styles.specialOfferText} onLayout={(event) => setTextWidth(event.nativeEvent.layout.width)}>
            {offerText || 'Special Offer'}
          </Text>
        </Animated.View>
      </View>
    </LinearGradient>
  );
});

const calculateDeliveryTime = (distance) => {
  if (distance < 3) return '15-20 mins';
  if (distance < 5) return '20-30 mins';
  return '30-45 mins';
};

const RestaurantCard = memo(({ item, onPress }) => {
  const isUnavailable = item.shop_active_status === "1";
  return (
    <TouchableOpacity
      style={[styles.restaurantCard, isUnavailable && styles.unavailableCard]}
      onPress={() => !isUnavailable && onPress(item)}
    >
      {/* {item.special_offer_status == "1" && (
        <SpecialOfferScroller offerText={item.special_offer_name} />
      )} */}
      <View style={styles.restaurantContent}>
        <View style={styles.restaurantImageContainer}>
          <Image source={item?.shop_image ? { uri: item.shop_image } : undefined} style={styles.restaurantImage} />
        </View>
        {isUnavailable && (
          <View style={styles.unavailableOverlay}>
            <Text style={styles.unavailableText}>Currently Unavailable</Text>
          </View>
        )}
        <View style={styles.restaurantTextContainer}>
          <Text style={styles.restaurantName}>{item.shop_name}</Text>
          <View style={styles.ratingRow}>
            <StarIcon />
            <Text style={styles.ratingText}>{item.shop_rating}</Text>
            <Text style={styles.dot}>•</Text>
            <View style={{ flexDirection: "row", gap: 5, alignItems: "center" }}>
              <Clock />
              <Text style={{ fontSize: 13, fontWeight: '400', color: '#000' }}>{calculateDeliveryTime(item.distance)}</Text>
            </View>
          </View>
          <Text style={styles.addressText} numberOfLines={3}>{item.shop_address || 'Tilak Road • 3.0 km'}</Text>
          {item.offer && (
            <View style={styles.offerTag}>
              <Text style={styles.offerText}>{item.offer}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default function UserHome({ navigation }) {
  const { categories, subCategories, banners, restaurants, activeCategoryIndex, loading, userAddress, serviceAvailable, homeRestaurnats } = useSelector(state => state.Dashboard);
  const { locationName } = useSelector(state => state.Auth);
  const { isNetworkConnected } = useSelector(state => state.address);
  const [selectedAddress, setSelectedAddress] = useState(userAddress || "");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isSubCategoriesExpanded, setIsSubCategoriesExpanded] = useState(false);
  const dispatch = useDispatch();
  const authLocation = useSelector(state => state.Auth.location);
  const [mounted, setMounted] = useState(true);
  const [initialNetLoad, setInitialNetLoad] = useState(false);
  const [serviceCheckFailed, setServiceCheckFailed] = useState(false);
  const [errorOccured, setErrorOccured] = useState(false);
  const networkStatusRef = useRef(isNetworkConnected);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    networkStatusRef.current = isNetworkConnected;
  }, [isNetworkConnected]);

  const isLoading = (loading.addressCheck || isLoadingLocation || loading.categories || loading.banners);

  const getAddressFromCoordinates = async (latitude, longitude) => {
    try {
      setErrorOccured(false);
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyBjxoAFhr00pjmZ95SEJYoUL98A6iX8hQ4`);
      const data = await response.json();
      if (data.results && data.results.length > 0) return data.results[0].formatted_address;
      return 'Address not found';
    } catch (error) {
      setErrorOccured(true);
      return 'Error getting address';
    }
  };

  const getCurrentLocation = useCallback(() => {
    setIsLoadingLocation(true);
    Geolocation.setRNConfiguration({ enableHighAccuracy: false, timeout: 2000, maximumAge: 1000 });
    Geolocation.getCurrentPosition(
      async position => {
        const { latitude, longitude } = position.coords;
        const address = await getAddressFromCoordinates(latitude, longitude);
        dispatch(setLocation({ latitude, longitude }));

        const currentLocationAddress = {
          address_type: userAddress?.address_type || 'Home',
          full_address: address,
          customer_latitude: latitude.toString(),
          customer_longitude: longitude.toString(),
          name: userAddress?.name || '',
          contact: userAddress?.contact || '',
        };

        if (!isNetworkConnected) return;
        dispatch(updateUserAddress(currentLocationAddress));
        setSelectedAddress(currentLocationAddress);
        setIsLoadingLocation(false);
      },
      error => {
        setIsLoadingLocation(false);
        networkStatusRef.current && navigation.replace('ServicesAvailable', { permissionDenied: true });
      },
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 1000 }
    );
  }, [dispatch, userAddress, isNetworkConnected, navigation]);

  const requestLocationPermission = useCallback(async () => {
    try {
      let permission = Platform.OS === 'ios' ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
      if (!permission) return;
      const status = await check(permission);
      if (status === RESULTS.GRANTED) {
        getCurrentLocation();
      } else {
        const reqStatus = await request(permission);
        if (reqStatus === RESULTS.GRANTED) getCurrentLocation();
        else networkStatusRef.current && navigation.replace('ServicesAvailable', { permissionDenied: true });
      }
    } catch (err) {
      networkStatusRef.current && navigation.replace('ServicesAvailable', { permissionDenied: true });
    }
  }, [getCurrentLocation, navigation]);

  const getCategoreis = async () => {
    try {
      setErrorOccured(false);
      dispatch(getCategories());
      dispatch(getSubCategories({ categoryId: activeCategoryIndex }));
      dispatch(getBanners());
      if (!restaurants || restaurants.length === 0) {
        dispatch(getRestaurantsHome({ categoryId: activeCategoryIndex }));
      }
    } catch (error) {
      setErrorOccured(true);
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
        if (!isNetworkConnected) return;
        setSelectedAddress(currentAddress);
      } else if (userAddress) {
        setSelectedAddress(userAddress);
      } else {
        requestLocationPermission();
      }
    };
    initializeLocation();
  }, [userAddress, authLocation, requestLocationPermission]);

  useFocusEffect(useCallback(() => { dispatch(getAddressList()); }, [dispatch]));
  useFocusEffect(useCallback(() => { dispatch(setActiveCategoryIndex(1)); }, [dispatch]));
  
  useFocusEffect(
    useCallback(() => {
      if (authLocation) checkServiceAvailability();
    }, [authLocation])
  );

  const handleSubCategories = useCallback(category => {
    dispatch(setActiveCategoryIndex(category.id));
    dispatch(getSubCategories({ categoryId: category.id }));
    dispatch(getRestaurantsHome({ categoryId: category.id }));
    dispatch(setOrderOfferAmount(category.order_offer_amount));
  }, [dispatch]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    getCategoreis();
    setRefreshing(false);
    dispatch(setActiveCategoryIndex(1));
  }, []);

  const checkServiceAvailability = async () => {
    const abortController = new AbortController();
    if (!authLocation || !mounted) return;
    try {
      setErrorOccured(false);
      const response = await dispatch(checkAddressExistence({ latitude: authLocation.latitude, longitude: authLocation.longitude }));
      if (mounted) {
        const payload = response?.payload;
        if (!payload?.data || payload.data.length === 0 || payload.data[0]?.active_status === 1) {
          if (networkStatusRef.current) {
            navigation.replace('ServicesAvailable', { locationNotAvailable: true, latitude: authLocation.latitude, longitude: authLocation.longitude });
          }
          return;
        }
        await dispatch(setLocationName(payload.data[0].location_name));
        await dispatch(setLocationId(payload.data[0].id));
        const result = await dispatch(getCategories());
        dispatch(setOrderOfferAmount(result.payload?.data[0]?.order_offer_amount));
        dispatch(getBanners());
        if (!restaurants || restaurants.length === 0) dispatch(getRestaurantsHome({ categoryId: activeCategoryIndex }));
        dispatch(getSubCategories({ categoryId: activeCategoryIndex }));
      }
    } catch (error) {
      setErrorOccured(true);
      if (error.name !== 'AbortError' && mounted && networkStatusRef.current) {
        navigation.replace('ServicesAvailable', { serviceCheckFailed: true, latitude: authLocation?.latitude, longitude: authLocation?.longitude });
      }
    }
    return () => { abortController.abort(); setMounted(false); };
  };

  useEffect(() => {
    if (authLocation) checkServiceAvailability();
  }, [authLocation, serviceAvailable]);

  const handleBannerPress = useCallback(async (banner) => {
    const resp = await dispatch(indiviadualShop({ shopId: banner?.shop_id }));
    if (!resp.payload.data[0] || resp.payload.data[0] <= 0) return;
    if (banner?.shop_id && banner?.shop_id !== 0) {
      navigation.navigate('BannerRestaurantScreen', { shopId: banner?.shop_id, shopItem: banner?.item_id, highlightItemId: 0 });
    }
  }, [dispatch, navigation]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async state => {
      if (state.isConnected && !isNetworkConnected) {
        setInitialNetLoad(true);
        await checkServiceAvailability();
        await Promise.all([
          dispatch(getCategories()),
          dispatch(getBanners()),
          dispatch(getRestaurantsHome({ categoryId: activeCategoryIndex })),
          dispatch(getSubCategories({ categoryId: activeCategoryIndex }))
        ]);
        setTimeout(() => setInitialNetLoad(false), 500);
      }
    });
    return () => unsubscribe();
  }, [isNetworkConnected, activeCategoryIndex, dispatch]);

  const renderSubCategoryItem = useCallback(({ item }) => (
    <TouchableOpacity onPress={() => { dispatch(setsubCategory(item)); navigation.navigate('CategorieItems'); }} style={styles.subCatWrapper}>
      <View style={styles.customCard}>
        <Image source={{ uri: item.sub_category_image }} style={styles.customImage} resizeMode="contain" />
      </View>
      <Text style={styles.customLabel} numberOfLines={2}>{item.sub_category_name}</Text>
    </TouchableOpacity>
  ), [dispatch, navigation]);

  // 4x2 Grid Category Renderer
  const renderCategoryItem = useCallback((item) => {
    const isActive = item.id == activeCategoryIndex;
    return (
      <TouchableOpacity key={item.id} style={styles.archCategoryTab} onPress={() => handleSubCategories(item)}>
        <View style={styles.archWrapper}>
          <LinearGradient 
            colors={['#85360B', '#FFCAB0', '#FFF6F2']}
            locations={[0, 0.5, 1]}
            style={styles.archBgGradient}
          />
          <Image source={{ uri: item.category_image }} resizeMode="contain" style={styles.archCategoryImage} />
        </View>
        <Text numberOfLines={1} style={isActive ? styles.activeCategoryText : styles.inactiveCategoryText}>
          {item.category_name}
        </Text>
      </TouchableOpacity>
    );
  }, [activeCategoryIndex, handleSubCategories]);

  const renderRestaurantItem = useCallback(({ item }) => (
    <RestaurantCard item={item} onPress={(shop) => navigation.navigate('RestaurantScreen', { shopId: shop.shop_id, shopItem: shop.shop_items_tb_nm, item: shop })} />
  ), [navigation]);

  const visibleSubCategories = useMemo(() => isSubCategoriesExpanded ? subCategories : subCategories?.slice(0, 12), [isSubCategoriesExpanded, subCategories]);

  const restaurantKeyExtractor = useCallback((item, index) => item?.id?.toString() || index.toString(), []);

  const ListHeader = useMemo(() => (
    <View style={styles.transparentBackground}>

      {/* 4x2 Categories Grid */}
      {categories && (
        <View style={styles.categoriesGridWrapper}>
          {categories.slice(0, 8).map(renderCategoryItem)}
        </View>
      )}

      {/* Wrapping the rest in a solid background so it transitions cleanly */}
      <View style={styles.solidBottomSection}>
        <BannerCarousel banners={banners} onBannerPress={handleBannerPress} />
        
        <Text style={styles.categoryHeaderTitle}>
          {categories?.find(cat => cat.id === activeCategoryIndex)?.category_name || "Category"} Categories
        </Text>
        <View style={styles.customContainer}>
          <FlatList
            data={visibleSubCategories}
            key={6}
            numColumns={6}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderSubCategoryItem}
            scrollEnabled={false}
          />
          {subCategories?.length > 12 && (
            <TouchableOpacity onPress={() => setIsSubCategoriesExpanded(prev => !prev)} style={styles.expandButton}>
              <Text style={styles.expandButtonText}>{isSubCategoriesExpanded ? "Show Less" : "See All"}</Text>
              <MaterialIcons name={isSubCategoriesExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={20} color={commonStyles.appMainColor} />
            </TouchableOpacity>
          )}
        </View>
        <View style={[commonStyles.row, { paddingHorizontal: 16, marginTop: 5, marginBottom: 10 }]}>
          <Text style={styles.popularShopsTitle}>Popular {activeCategoryIndex === 1 ? "Restaurants" : "Shops"}</Text>
        </View>
      </View>
    </View>
  ), [categories, banners, visibleSubCategories, subCategories, isSubCategoriesExpanded, activeCategoryIndex, renderCategoryItem, renderSubCategoryItem, navigation, handleBannerPress]);

  return (
    <View style={[styles.mainContainer, { paddingTop: insets.top }]}>
      <StatusBar backgroundColor={'#85360B'} translucent barStyle={'light-content'} />
      <View style={styles.container}>

        {/* ABSOLUTE GRADIENT BACKGROUND - Trimmed to sit right below the search bar */}
        <LinearGradient
          colors={['#85360B', '#DAAE97', '#FFE2D4', '#FFFFFF']}
          locations={[0, 0.60, 0.85, 1]}
          style={styles.absoluteGradientBg}
        />

        {isNetworkConnected === null ? <Skeleton /> : !isNetworkConnected && !categories ? (
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
            <TouchableOpacity style={styles.retryButton} onPress={checkServiceAvailability}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : isLoading || initialNetLoad ? <Skeleton /> : serviceAvailable ? (
          <>
            {/* FIXED TOP HEADER & SEARCH BAR */}
            <View style={styles.fixedTopSection}>
              {/* Location & Icons */}
              <View style={styles.newHeaderContent}>
                <TouchableOpacity onPress={() => navigation.navigate("SelectServiceFromLocation", { selectedAddress })} style={styles.newLocationContainer}>
                  <View style={styles.homeIconBox}><SimpleLineIcons name="home" color="#FFF" size={20} /></View>
                  <View style={styles.newLocationTextWrap}>
                    <View style={styles.newLocationRow}>
                      <Text style={styles.newLocationTitle}>{locationName ? locationName : 'Home'}</Text>
                      <MaterialIcons name="keyboard-arrow-down" color="#FFF" size={18} />
                    </View>
                    <Text style={styles.newLocationDesc} numberOfLines={1}>{selectedAddress?.full_address || 'Tap to choose delivery location'}</Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.rightHeaderActions}>
                  <TouchableOpacity style={styles.headerCircleBtn} onPress={() => navigation.navigate('Notifications')}>
                    <FontAwesome6 name="bell" size={16} color="#333" />
                    <View style={styles.notificationDotMarker} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.headerCircleBtn} onPress={() => navigation.navigate('Cart')}>
                    <SimpleLineIcons name="handbag" size={16} color="#333" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Fixed Search Bar (Redirects to Menu) */}
              <TouchableOpacity 
                activeOpacity={0.9} 
                style={styles.searchPillContainer}
                onPress={() => navigation.navigate('Categories')} 
              >
                <Feather name="search" size={20} color="#979797" style={styles.searchIconLeft} />
                <Text style={styles.searchInputPillText}>Search here..</Text>
                <View style={styles.searchDivider} />
                <MaterialCommunityIcons name="menu-open" size={22} color="#8C8C8C" />
              </TouchableOpacity>
            </View>

            {/* SCROLLING CONTENT (Starts right below search bar) */}
            <FlatList
              data={homeRestaurnats}
              keyExtractor={restaurantKeyExtractor}
              renderItem={renderRestaurantItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
              ListHeaderComponent={ListHeader}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}><Text style={styles.emptyText}>No popular restaurants/shops available</Text></View>
              )}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[commonStyles.appMainColor]} tintColor="#FFF" />}
            />
          </>
        ) : serviceAvailable === false ? <ServiceUnavailableScreen /> : !categories && !errorOccured ? <Skeleton /> : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Something went wrong</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => { checkServiceAvailability(); getCategoreis(); }}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#85360B" },
  container: { flex: 1, backgroundColor: colors.white, position: 'relative' },
  
  /* Absolute Gradient Background */
  absoluteGradientBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 190,
    zIndex: 0,
  },

  /* Fixed Header Styles */
  fixedTopSection: {
    zIndex: 1, // Ensures search and header sit permanently over the background
    paddingBottom: 10,
  },
  newHeaderContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  newLocationContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  homeIconBox: { justifyContent: 'center', alignItems: 'center', width: 24, height: 24 },
  newLocationTextWrap: { flexDirection: 'column', justifyContent: 'center', maxWidth: responsiveWidth(55) },
  newLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  newLocationTitle: { fontFamily: 'SF Pro Display', fontWeight: '700', fontSize: 16, color: '#FFFFFF' },
  newLocationDesc: { fontFamily: 'SF Pro Display', fontWeight: '500', fontSize: 12, color: '#FFFFFF' },
  rightHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerCircleBtn: { width: 34, height: 34, backgroundColor: '#FFFFFF', borderRadius: 17, justifyContent: 'center', alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
  notificationDotMarker: { position: 'absolute', top: 8, right: 8, width: 6, height: 6, backgroundColor: '#FF3B30', borderRadius: 3, borderWidth: 1, borderColor: '#FFF' },

  /* Search Pill Styles (Now clickable) */
  searchPillContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 24, marginHorizontal: 16, marginTop: 5, height: 48, paddingHorizontal: 16, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
  searchIconLeft: { marginRight: 8 },
  searchInputPillText: { flex: 1, fontSize: 16, fontFamily: 'SF Pro Display', color: '#979797' },
  searchDivider: { width: 1, height: 24, backgroundColor: '#E0E0E0', marginHorizontal: 12 },

  /* 4x2 Grid Category Styles - Gap reduced heavily */
  transparentBackground: { backgroundColor: 'transparent' }, 
  categoriesGridWrapper: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, justifyContent: 'space-between', paddingBottom: 0 },
  archCategoryTab: { width: (screenWidth - 32) / 4 - 4, alignItems: 'center', marginBottom: 8 },
  
  archWrapper: {
    width: '100%',
    aspectRatio: 0.95, 
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  archBgGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '8%', 
    bottom: 0,
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    borderWidth: 2,
    borderColor: '#FFDCCB',
  },
  archCategoryImage: {
    width: '95%',
    height: '95%',
    resizeMode: 'contain',
    marginBottom: '15%', 
  },
  
  activeCategoryText: { fontSize: 12, fontWeight: '800', color: commonStyles.appMainColor, textAlign: 'center' },
  inactiveCategoryText: { fontSize: 12, fontWeight: '500', color: '#313131', textAlign: 'center' },

  /* Remaining Solid Background Section (Tightened gap for Banners) */
  solidBottomSection: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 0 },
  subCatWrapper: { width: itemWidth - 12, margin: 5, alignItems: "center", alignSelf: "flex-start", borderRadius: 8 },
  customCard: { width: itemWidth - 12, height: 50, margin: 6, paddingVertical: 12, backgroundColor: '#FFDCCB', alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  customImage: { width: 40, height: 40, marginBottom: 4 },
  customLabel: { fontSize: 10, fontWeight: '500', textAlign: 'center', color: '#000' },
  categoryHeaderTitle: { fontSize: 18, fontWeight: '600', marginLeft: 16, marginTop: 10, color: '#000' },
  customContainer: { paddingHorizontal: 8, paddingTop: 5, backgroundColor: '#FFFFFF', marginBottom: 4 },
  popularShopsTitle: { fontSize: 20, fontWeight: '700', color: '#2B2B2B' },
  bannerContainer: { width: responsiveWidth(100), height: 160, paddingHorizontal: 16, marginVertical: 4 },
  bannerImage: { width: '100%', height: '100%', borderRadius: 12 },
  restaurantCard: { marginBottom: 16, borderRadius: 12, backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, marginHorizontal: 16 },
  restaurantContent: { flexDirection: 'row', alignItems: 'flex-start', position: 'relative' },
  restaurantImageContainer: { width: 110, height: 110, overflow: 'hidden', marginRight: 15, borderTopLeftRadius: 12, borderBottomLeftRadius: 12 },
  restaurantImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  restaurantTextContainer: { flex: 1, justifyContent: 'center', paddingVertical: 10, paddingRight: 10 },
  restaurantName: { fontSize: 16, fontWeight: '700', color: '#000' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  ratingText: { fontSize: 13, marginLeft: 4, color: '#000', fontWeight: '600' },
  dot: { marginHorizontal: 6, fontSize: 14, color: '#888' },
  addressText: { fontSize: 12, color: '#666', marginTop: 6 },
  offerTag: { backgroundColor: '#ECFFF3', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginTop: 8, alignSelf: 'flex-start' },
  offerText: { fontSize: 10, color: '#07772F', fontWeight: '700' },
  specialOfferContainer: { borderRadius: 3, paddingHorizontal: 1, paddingVertical: 0, shadowColor: '#FF6B35', elevation: 8, borderWidth: 1, borderColor: '#FF8C42' },
  specialOfferText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF', letterSpacing: 1.2, textTransform: 'uppercase' },
  specialOfferScrollContent: { paddingHorizontal: 5, overflow: 'hidden', height: 24, justifyContent: 'center' },
  specialOfferTextContainer: { flexDirection: 'row', alignItems: 'center', position: 'absolute', left: 0, height: 24 },
  expandButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, marginTop: 5, borderTopWidth: 0.5, borderTopColor: '#eee' },
  expandButtonText: { fontSize: 13, fontWeight: '600', color: '#333', marginRight: 4 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#666', textAlign: 'center' },
  offlineContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  offlineText: { fontSize: 18, color: '#333', marginTop: 10, textAlign: 'center' },
  offlineSubText: { fontSize: 14, color: '#666', marginTop: 5, textAlign: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white },
  errorText: { fontSize: 20, fontWeight: '600', color: 'grey', marginBottom: 20 },
  errorSubText: { fontSize: 16, color: '#666', marginTop: 5, textAlign: 'center' },
  retryButton: { backgroundColor: '#065E2C', padding: 15, borderRadius: 8, marginTop: 20 },
  retryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  unavailableCard: { opacity: 0.6, backgroundColor: '#f0f0f0' },
  unavailableOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, padding: 20, justifyContent: 'center', alignItems: 'center', zIndex: 1, borderRadius: 15 },
  unavailableText: { color: '#D9534F', fontWeight: '700', fontSize: 14, letterSpacing: 1, textTransform: 'uppercase' }
});