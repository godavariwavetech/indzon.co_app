import React, { useCallback, useEffect, useRef, useState, memo, useMemo } from 'react';
import { GOOGLE_MAPS_API_KEY } from '../../config/googleMaps';
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
import Geolocation from 'react-native-geolocation-service';
import { setLocation, setLocationId, setLocationName, setOrderOfferAmount } from '../../redux/reducers/auth';
import ServiceUnavailableScreen from './ServiceUnavailableScreen';
import NetInfo from '@react-native-community/netinfo';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import Feather from 'react-native-vector-icons/Feather';
import Permissions, { PERMISSIONS, RESULTS, check, request } from 'react-native-permissions';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import commonStyles from '../../commonstyles/CommonStyles';
import { colors } from '../../config/theme';
import { indiviadualShop } from '../../redux/reducers/addressSlice';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Skeleton from './Skeleton';
import FoodArtwork from './tabassets/Food';
import GroceryArtwork from './tabassets/Goceries';
import MeatArtwork from './tabassets/Meat';

const defaultCategories = [
  { key: 'food', category_name: 'Food', Artwork: FoodArtwork },
  { key: 'grocery', category_name: 'Grocery', Artwork: GroceryArtwork },
  { key: 'produce', category_name: 'Vegetable & Fruits', image: require('./svg/vegetables.png') },
  { key: 'meat', category_name: 'Meat', Artwork: MeatArtwork },
  { key: 'pickles', category_name: 'Pickles', icon: 'food-variant' },
  { key: 'care', category_name: 'Personal Care', icon: 'bottle-tonic-plus' },
  { key: 'snacks', category_name: 'Snacks', icon: 'cookie' },
  { key: 'dairy', category_name: 'Dairy Items', icon: 'bottle-soda-classic' },
];

const screenWidth = Dimensions.get('window').width;
const categoryGap = Math.round(screenWidth * 0.045);
// Fit four columns between equal side insets without an empty trailing slot.
const itemWidth = (screenWidth - 40 - categoryGap * 3) / 4;

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
        resizeMode="cover"
      />
    </TouchableOpacity>
  ), [onBannerPress]);

  return (
    <View style={styles.bannerCarousel}>
      <FlatList
        ref={flatListRef}
        data={banners}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderBannerItem}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(
            event.nativeEvent.contentOffset.x / responsiveWidth(100),
          );
          setCurrentIndex(index);
        }}
        getItemLayout={(data, index) => ({
          length: responsiveWidth(100),
          offset: responsiveWidth(100) * index,
          index,
        })}
        initialNumToRender={1}
        maxToRenderPerBatch={1}
        windowSize={3}
        removeClippedSubviews
      />
      {banners?.length > 0 && (
        <View style={styles.bannerPagination}>
          {banners.slice(0, 4).map((banner, index) => (
            <View
              key={banner.id ?? index}
              style={[
                styles.bannerPaginationDot,
                index === currentIndex && styles.bannerPaginationDotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
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
      {item.special_offer_status == "1" && item.special_offer_name?.trim() && (
        <SpecialOfferScroller offerText={item.special_offer_name.trim()} />
      )}
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
          <View style={styles.shopTitleRow}>
            <Text style={[styles.restaurantName, { flex: 1 }]} numberOfLines={1}>{item.shop_name}</Text>
            <View style={styles.shopMoreIcon}>
              <MaterialCommunityIcons name="dots-vertical" size={13} color="#929292" />
            </View>
          </View>
          <Text style={styles.shopTypeLabel} numberOfLines={1}>{item.category_name || 'Restaurant'}</Text>
          <Text style={styles.shopDeliveryText}>{'\u2022'} Delivery in {calculateDeliveryTime(item.distance)}</Text>
          <View style={styles.shopRatingBadge}>
            <Text style={styles.shopRatingValue}>{item.shop_rating ?? 'New'}</Text>
            <MaterialIcons name="star" size={12} color="#FFFFFF" />
          </View>
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
  const { categories, subCategories, banners, activeCategoryIndex, loading, userAddress, serviceAvailable, homeRestaurnats, cartItems } = useSelector(state => state.Dashboard);
  const { locationName } = useSelector(state => state.Auth);
  const { isNetworkConnected } = useSelector(state => state.address);
  const [selectedAddress, setSelectedAddress] = useState(userAddress || "");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const dispatch = useDispatch();
  const authLocation = useSelector(state => state.Auth.location);
  const [mounted, setMounted] = useState(true);
  const [initialNetLoad, setInitialNetLoad] = useState(false);
  const [serviceCheckFailed, setServiceCheckFailed] = useState(false);
  const [errorOccured, setErrorOccured] = useState(false);
  const networkStatusRef = useRef(isNetworkConnected);
  const isCheckingRef = useRef(false);
  const insets = useSafeAreaInsets();

  const cartCount = useMemo(() => {
    return cartItems?.reduce((total, item) => total + item.quantity, 0) || 0;
  }, [cartItems]);

  useEffect(() => {
    networkStatusRef.current = isNetworkConnected;
  }, [isNetworkConnected]);

  const isLoading = (loading.addressCheck || isLoadingLocation || loading.categories || loading.banners);

  const getAddressFromCoordinates = async (latitude, longitude) => {
    try {
      setErrorOccured(false);
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`);
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
    Geolocation.setRNConfiguration({ enableHighAccuracy: false, timeout: 20000, maximumAge: 1000 });
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

  const getCategoriesData = async () => {
    try {
      setErrorOccured(false);
      const categoriesResult = await dispatch(getCategories());
      const firstCategory = categoriesResult.payload?.data?.[0];
      const categoryId = firstCategory?.id ?? activeCategoryIndex;

      if (categoryId != null) {
        dispatch(setActiveCategoryIndex(categoryId));
        dispatch(setOrderOfferAmount(firstCategory?.order_offer_amount ?? 0));
        await Promise.all([
          dispatch(getSubCategories({ categoryId })),
          dispatch(getRestaurantsHome({ categoryId })),
        ]);
      }
      dispatch(getBanners());
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

  const checkServiceAvailability = async (force = false) => {
    if (!authLocation || !mounted || (isCheckingRef.current && !force)) return;
    
    isCheckingRef.current = true;
    try {
      setErrorOccured(false);
      const response = await dispatch(checkAddressExistence({ latitude: authLocation.latitude, longitude: authLocation.longitude }));
      
      if (mounted) {
        if (checkAddressExistence.fulfilled.match(response)) {
          setServiceCheckFailed(false);
          const payload = response.payload;
          if (!payload?.data || payload.data.length === 0 || payload.data[0]?.active_status === 1) {
            if (networkStatusRef.current) {
              navigation.replace('ServicesAvailable', { locationNotAvailable: true, latitude: authLocation.latitude, longitude: authLocation.longitude });
            }
            return;
          }
          await dispatch(setLocationName(payload.data[0].location_name));
          await dispatch(setLocationId(payload.data[0].id));
          
          // Refresh data in background
          getCategoriesData();
        } else {
          // Only show error if we have no categories and no restaurants
          if ((!categories || categories.length === 0) && (!homeRestaurnats || homeRestaurnats.length === 0)) {
            setServiceCheckFailed(true);
          }
        }
      }
    } catch (error) {
      if (mounted && (!categories || categories.length === 0)) {
        setServiceCheckFailed(true);
      }
    } finally {
      isCheckingRef.current = false;
    }
  };

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (authLocation) {
      await checkServiceAvailability(true);
    } else {
      await getCategoriesData();
    }
    setRefreshing(false);
  }, [authLocation]);

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
        await checkServiceAvailability(true);
        setTimeout(() => setInitialNetLoad(false), 500);
      }
    });
    return () => unsubscribe();
  }, [isNetworkConnected, authLocation]);

  const renderSubCategoryItem = useCallback(({ item }) => (
    <TouchableOpacity onPress={() => { dispatch(setsubCategory(item)); navigation.navigate('CategorieItems'); }} style={styles.subCatWrapper}>
      <View style={styles.customCard}>
        <View style={styles.subCategoryBrownBase}>
          <LinearGradient colors={['#D99A70', '#BA784F', '#99502D', '#793B1E']} locations={[0, 0.22, 0.58, 1]} style={StyleSheet.absoluteFillObject} />
          <LinearGradient
            colors={['rgba(255,240,215,0)', 'rgba(255,240,215,0.28)', 'rgba(255,240,215,0)']}
            locations={[0, 0.45, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFillObject}
          />
        </View>
        <Image source={{ uri: item.sub_category_image }} style={styles.customImage} resizeMode="contain" />
      </View>
      <Text style={styles.customLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{item.sub_category_name}</Text>
    </TouchableOpacity>
  ), [dispatch, navigation]);

  // 4x2 Grid Category Renderer
  const renderCategoryItem = useCallback((item) => {
    const isActive = item.id == activeCategoryIndex;
    return (
      <TouchableOpacity key={item.id || item.key} accessibilityRole="button" accessibilityLabel={item.category_name} style={styles.archCategoryTab} onPress={() => item.id ? handleSubCategories(item) : navigation.navigate('Categories')}>
        <View style={styles.archWrapper}>
          <LinearGradient 
            colors={['#A86944', '#F8CEB7', '#FFF3EB']}
            locations={[0, 0.5, 1]}
            style={styles.archBgGradient}
          />
          <View style={styles.archArtworkFrame}>
          {item.category_image ? (
            <Image source={{ uri: item.category_image }} resizeMode="contain" style={styles.archCategoryImage} />
          ) : item.Artwork ? (
            <item.Artwork width="100%" height="100%" />
          ) : item.image ? (
            <Image source={item.image} resizeMode="contain" style={styles.archCategoryImage} />
          ) : (
            <MaterialCommunityIcons name={item.icon} size={Math.round(screenWidth * 0.135)} color="#A55227" />
          )}
          </View>
        </View>
        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={isActive ? styles.activeCategoryText : styles.inactiveCategoryText}>
          {item.category_name}
        </Text>
      </TouchableOpacity>
    );
  }, [activeCategoryIndex, handleSubCategories, navigation]);

  const renderRestaurantItem = useCallback(({ item }) => (
    <View style={styles.restaurantRow}>
      <RestaurantCard item={item} onPress={(shop) => navigation.navigate('RestaurantScreen', { shopId: shop.shop_id, shopItem: shop.shop_items_tb_nm, item: shop })} />
    </View>
  ), [navigation]);

  const visibleSubCategories = useMemo(() => subCategories?.slice(0, 12), [subCategories]);

  const restaurantKeyExtractor = useCallback((item, index) => item?.id?.toString() || index.toString(), []);

  const ListHeader = useMemo(() => (
    <View style={styles.transparentBackground}>

      {/* 4x2 Categories Grid */}
      <View style={styles.categoriesGridWrapper}>
        {(categories?.length ? categories.slice(0, 8) : defaultCategories).map(renderCategoryItem)}
      </View>

      {/* Wrapping the rest in a solid background so it transitions cleanly */}
      <View style={styles.solidBottomSection}>
        <BannerCarousel banners={banners} onBannerPress={handleBannerPress} />
        
        <Text style={styles.categoryHeaderTitle}>
          {categories?.find(cat => cat.id == activeCategoryIndex)?.category_name || "Food"} Categories
        </Text>
        <View style={styles.customContainer}>
          <FlatList
            data={visibleSubCategories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderSubCategoryItem}
            contentContainerStyle={styles.foodCategoriesContent}
          />
        </View>
        <View style={[commonStyles.row, { paddingHorizontal: 16, marginTop: 5, marginBottom: 10 }]}>
          <Text style={styles.popularShopsTitle}>
            Popular {categories?.find(category => category.id === activeCategoryIndex)?.category_name?.toLowerCase().includes('restaurant') ? 'Restaurants' : 'Shops'}
          </Text>
        </View>
      </View>
    </View>
  ), [categories, banners, visibleSubCategories, subCategories, activeCategoryIndex, renderCategoryItem, renderSubCategoryItem, navigation, handleBannerPress]);

  return (
    <View style={styles.mainContainer}>
      <StatusBar backgroundColor="transparent" translucent barStyle="light-content" />
      <View style={styles.container}>

        {/* Header background fades to white before the second category row. */}
        <LinearGradient
          colors={['#88401D', '#BC896D', '#F6D8C8', '#FFFFFF']}
          locations={[0, 0.27, 0.58, 1]}
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
            <View style={[styles.fixedTopSection, { paddingTop: insets.top }]}>
              {/* Location & Icons */}
              <View style={styles.newHeaderContent}>
                <TouchableOpacity onPress={() => navigation.navigate("SelectServiceFromLocation", { selectedAddress })} style={styles.newLocationContainer}>
                  
                  <View style={styles.newLocationTextWrap}>
                    <View style={styles.newLocationRow}>
                      <MaterialCommunityIcons name="home" color="#FFF" size={17} />
                      <Text style={styles.newLocationTitle}>{selectedAddress?.address_type || 'Home'}</Text>
                      <MaterialIcons name="keyboard-arrow-down" color="#FFF" size={18} />
                    </View>
                    <Text style={styles.newLocationDesc} numberOfLines={1}>{selectedAddress?.full_address || 'Tap to choose delivery location'}</Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.rightHeaderActions}>
                  <TouchableOpacity style={styles.headerCircleBtn} onPress={() => navigation.navigate('Notifications')}>
                    <MaterialCommunityIcons name="bell" size={23} color="#FFC400" />
                    <View style={styles.notificationDotMarker} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.headerCircleBtn} onPress={() => navigation.navigate('Cart')}>
                    <MaterialCommunityIcons name="cart" size={23} color="#C52961" />
                    {cartCount > 0 && (
                      <View style={styles.cartBadge}>
                        <Text style={styles.cartBadgeText}>{cartCount}</Text>
                      </View>
                    )}
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
                <MaterialCommunityIcons name="notebook-outline" size={23} color="#8C8C8C" />
              </TouchableOpacity>
            </View>

            {/* SCROLLING CONTENT (Starts right below search bar) */}
            <FlatList
              data={homeRestaurnats}
              keyExtractor={restaurantKeyExtractor}
              renderItem={renderRestaurantItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 12 }}
              ListHeaderComponent={ListHeader}
              initialNumToRender={6}
              maxToRenderPerBatch={10}
              windowSize={5}
              removeClippedSubviews={Platform.OS === 'android'}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}><Text style={styles.emptyText}>No popular restaurants/shops available</Text></View>
              )}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[commonStyles.appMainColor]} tintColor="#FFF" />}
            />
          </>
        ) : serviceAvailable === false ? <ServiceUnavailableScreen /> : !categories && !errorOccured ? <Skeleton /> : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Something went wrong</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => { checkServiceAvailability(true); getCategoriesData(); }}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#88401D" },
  container: { flex: 1, backgroundColor: colors.white, position: 'relative' },
  
  /* Absolute Gradient Background */
  absoluteGradientBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 292,
    zIndex: 0,
  },

  /* Fixed Header Styles */
  fixedTopSection: {
    zIndex: 1, // Ensures search and header sit permanently over the background
    paddingBottom: 12,
  },
  newHeaderContent: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  newLocationContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  homeIconBox: { justifyContent: 'center', alignItems: 'center', width: 24, height: 24 },
  newLocationTextWrap: { flexDirection: 'column', justifyContent: 'center', maxWidth: responsiveWidth(55) },
  newLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  newLocationTitle: { fontFamily: 'SF Pro Display', fontWeight: '700', fontSize: 16, color: '#FFFFFF' },
  newLocationDesc: { fontFamily: 'SF Pro Display', fontWeight: '500', fontSize: 12, color: '#FFFFFF', marginTop: 2 },
  rightHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerCircleBtn: { width: 34, height: 34, backgroundColor: '#FFFFFF', borderRadius: 17, justifyContent: 'center', alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
  notificationDotMarker: { position: 'absolute', top: 8, right: 8, width: 6, height: 6, backgroundColor: '#FF3B30', borderRadius: 3, borderWidth: 1, borderColor: '#FFF' },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#FFF',
    zIndex: 1,
  },
  cartBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'SF Pro Display',
  },

  /* Search Pill Styles (Now clickable) */
  searchPillContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 18, marginHorizontal: 16, marginTop: 6, height: 48, paddingHorizontal: 16, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
  searchIconLeft: { marginRight: 8 },
  searchInputPillText: { flex: 1, fontSize: 16, fontFamily: 'SF Pro Display', color: '#979797' },
  searchDivider: { width: 1, height: 24, backgroundColor: '#E0E0E0', marginHorizontal: 12 },

  /* Main category grid */
  transparentBackground: { backgroundColor: 'transparent' },
  categoriesGridWrapper: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingTop: 18, justifyContent: 'space-between', backgroundColor: '#FFFFFF' },
  archCategoryTab: { width: (screenWidth - 68) / 4, alignItems: 'center', marginBottom: 18 },
  
  archWrapper: {
    width: '100%',
    aspectRatio: 0.92,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  archArtworkFrame: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  archBgGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0, 
    bottom: 0,
    borderTopLeftRadius: 46,
    borderTopRightRadius: 46,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderColor: '#F0D5C7',
  },
  archCategoryImage: {
    width: '92%',
    height: '92%',
    resizeMode: 'contain',
    marginBottom: 0, 
  },
  
  activeCategoryText: { fontSize: 11, fontWeight: '400', color: '#202020', textAlign: 'center' },
  inactiveCategoryText: { fontSize: 11, fontWeight: '400', color: '#202020', textAlign: 'center' },

  /* Banner and food category section */
  solidBottomSection: { backgroundColor: '#FFFFFF', paddingTop: 0 },
  bannerCarousel: { backgroundColor: '#FFFFFF' },
  bannerPagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 22, gap: 5 },
  bannerPaginationDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D8D8D8' },
  bannerPaginationDotActive: { width: 24, backgroundColor: '#2F3338' },
  subCatWrapper: { width: 72, marginRight: 12, alignItems: 'center', alignSelf: 'flex-start' },
  customCard: { width: 72, height: 72, marginBottom: 8, backgroundColor: '#FBE1D4', alignItems: 'center', justifyContent: 'center', borderRadius: 16, overflow: 'hidden' },
  customImage: { width: 64, height: 64 },
  customLabel: { fontSize: 13, fontWeight: '500', textAlign: 'center', color: '#000' },
  categoryHeaderTitle: { fontSize: 23, fontWeight: '700', marginLeft: 16, marginTop: 14, marginBottom: 8, color: '#000' },
  customContainer: { paddingLeft: 16, paddingTop: 2, backgroundColor: '#FFFFFF', marginBottom: 8 },
  foodCategoriesContent: { paddingRight: 16 },
  popularShopsTitle: { fontSize: 20, fontWeight: '700', color: '#2B2B2B' },
  bannerContainer: { width: responsiveWidth(100), height: 176, paddingHorizontal: 16, marginVertical: 4 },
  bannerImage: { width: '100%', height: '100%', borderRadius: 12 },
  subCategoryBrownBase: { position: 'absolute', width: itemWidth * 1.16, height: itemWidth * 0.9, bottom: -itemWidth * 0.48, borderRadius: itemWidth, overflow: 'hidden' },
  restaurantRow: { backgroundColor: '#FFFFFF', paddingVertical: 8 },
  restaurantListFooter: { height: 110, backgroundColor: '#FFFFFF' },
  restaurantCard: { borderRadius: 12, backgroundColor: '#fff', boxShadow: '0px 0px 6px 1px rgba(0, 0, 0, 0.08)', marginHorizontal: 16 },
  restaurantContent: { flexDirection: 'row', alignItems: 'stretch', minHeight: 110, position: 'relative', borderRadius: 12, overflow: 'hidden' },
  restaurantImageContainer: { width: '44%', overflow: 'hidden', marginRight: 12 },
  restaurantImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', resizeMode: 'cover' },
  restaurantTextContainer: { flex: 1, justifyContent: 'center', paddingVertical: 10, paddingRight: 10 },
  restaurantName: { fontSize: 16, fontWeight: '700', color: '#000' },
  shopSectionHeading: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginTop: 24, marginBottom: 16, gap: 8 },
  shopHeadingRule: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: '#CFCFCF' },
  shopTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  shopMoreIcon: { width: 19, height: 19, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: '#BDBDBD', alignItems: 'center', justifyContent: 'center' },
  shopTypeLabel: { fontSize: 12, color: '#6D6D6D', marginTop: 5 },
  shopDeliveryText: { fontSize: 12, fontWeight: '600', color: '#087B38', marginTop: 7 },
  shopRatingBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 3, backgroundColor: '#087B38', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3, marginTop: 9 },
  shopRatingValue: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
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
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40, backgroundColor: '#FFFFFF' },
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
