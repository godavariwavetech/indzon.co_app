import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  StatusBar,
  Animated,
  PanResponder,
  ActivityIndicator,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from 'react-native-responsive-dimensions';
import Icon from 'react-native-vector-icons/MaterialIcons';
import HeaderPick2 from './tabassets/HeaderPick2';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, getItemsList, removeFromCart, setCartRestaurant } from '../../redux/reducers/daddy';
import { globalSearch, setRestaurnatDetails } from '../../redux/reducers/auth';
import StarRating from '../../components/StarRating';
import commonStyles from '../../commonstyles/CommonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';


const RestaurantScreen = ({ navigation, route }) => {
  const [translateY] = useState(new Animated.Value(100));
  const dispatch = useDispatch();
  const { restaurantItems, cartItems, cartRestaurant } = useSelector(state => state.Dashboard)
  const [filterType, setFilterType] = useState("All");
  const [filteredData, setFilterData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState(route.params?.selectedFilter ? [route.params.selectedFilter] : ['All']);
  const pan = useRef(new Animated.ValueXY({ x: responsiveWidth(100) - 88, y: responsiveHeight(100) - 138 })).current;
  const [draggableMenuVisible, setDraggableMenuVisible] = useState(false);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const timeoutRef = useRef();
  const [highlightedItemId, setHighlightedItemId] = useState(null);
  const scaleAnims = useRef(new Map()).current;
  const [renderedItems, setRenderedItems] = useState(new Set());
  const [initialFilter, setSetInitialFilter] = useState(true);
  const flatListRef = useRef(null);
  const [selectedFilter, setSelectedFilter] = useState("All");
  // state for active filters
  // const [activeFilters, setActiveFilters] = useState([]);

  // state for subcategory filter (if you want only one subcategory active at a time)
  const [activeSubCategoryFilter, setActiveSubCategoryFilter] = useState(null);

  console.log("yemoooooooooooooooooooooooooo", filteredData)

  // Restore original mergedFilters
  // const mergedFilters = [
  //   { filter_name: 'All', id: 'all' },
  //   ...[...new Set((restaurantItems || [])
  //     .map(item => item.filter_one)
  //     .filter(Boolean))]
  //     .map(filterName => ({
  //       filter_name: filterName,
  //       id: filterName.toLowerCase().replace(' ', '-')
  //     }))
  // ]; 
  // Collect unique values for filters
  const allFilters = [
    { filter_name: 'All', id: 'all', type: 'general' },

    // filter_one (Veg/Non Veg)
    ...[...new Set((restaurantItems || []).map(item => item.filter_one).filter(Boolean))]
      .map(f => ({ filter_name: f, id: f.toLowerCase().replace(/\s+/g, '-'), type: 'filter_one' })),

    // category_name
    // ...[...new Set((restaurantItems || []).map(item => item.category_name).filter(Boolean))]
    //   .map(c => ({ filter_name: c, id: c.toLowerCase().replace(/\s+/g, '-'), type: 'category' })),

    // sub_category_name
    ...[...new Set((restaurantItems || []).map(item => item.sub_category_name).filter(Boolean))]
      .map(sc => ({ filter_name: sc, id: sc.toLowerCase().replace(/\s+/g, '-'), type: 'subcategory' })),
  ];


  const shopId = route.params
  console.log("shopId", shopId)
  const getItems = async () => {

    try {
      setIsLoading(true);
      const response = await dispatch(getItemsList({ shopId: route.params.shopId, shopItem: route.params.shopItem }))
      setFilterData(response.payload.data);

      route?.params?.selectedFilter && setSetInitialFilter(!initialFilter)
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setIsLoading(false);
    }

  }

  useEffect(() => {
    if (!restaurantItems) return;

    const filtered = restaurantItems.filter(item => {
      const matchesSearch =
        item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.item_description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        selectedFilter === "All" ||
        item.filter_one === selectedFilter ||
        item.category_name === selectedFilter;

      const matchesSubCategory =
        !activeSubCategoryFilter || activeSubCategoryFilter === item.sub_category_name;

      return matchesSearch && matchesFilter && matchesSubCategory;
    });

    setFilterData(filtered);
  }, [searchQuery, selectedFilter, activeSubCategoryFilter, restaurantItems, initialFilter]);




  useEffect(() => {
    route.params && getItems();

  }, [route.params])

  useEffect(() => {
    if (route.params?.highlightItemId) {
      const itemId = route.params.highlightItemId;
      setHighlightedItemId(itemId);

      if (!scaleAnims.has(itemId)) {
        scaleAnims.set(itemId, new Animated.Value(1));
      }

      const timer = setTimeout(() => {
        setHighlightedItemId(null);
        setRenderedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
        scaleAnims.get(itemId)?.setValue(1);
      }, 2000);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [route.params]);

  const calculateDeliveryTime = (distance) => {
    if (distance < 3) {
      return '15-20 mins';
    } else if (distance < 5) {
      return '20-30 mins';
    } else {
      return '30-45 mins';
    }
  };

  const handleAddToCart = (item) => {
    if (cartItems.length === 0 || cartRestaurant == route.params.shopId) {
      addItem(item);
      dispatch(setRestaurnatDetails(route.params.item))
    } else {
      setSelectedItem(item);
      setShowReplaceModal(true);
    }
  };

  const handleReplaceCart = () => {
    dispatch(setCartRestaurant(route.params.shopId));
    dispatch(setRestaurnatDetails(route.params.item))
    dispatch(addToCart(selectedItem));
    setShowReplaceModal(false);
    setSelectedItem(null);
  };

  const handleCancelReplace = () => {
    setShowReplaceModal(false);
    setSelectedItem(null);
  };


  const startAnim = () => {
    Animated.timing(translateY, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }
  const stopAnim = () => {
    Animated.timing(translateY, {
      toValue: 100,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }



  const addItem = (item) => {
    // dispatch(setCartRestaurant())
    dispatch(addToCart(item))
  }

  const decreaseItem = (item) => {
    dispatch(removeFromCart(item))
  }

  useEffect(() => {
    Object.keys(cartItems).length > 0 ? startAnim() : stopAnim()
  }, [Object.keys(cartItems).length])

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {

        pan.setOffset({ x: pan.x._value, y: pan.y._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([
        null,
        { dx: pan.x, dy: pan.y }
      ], { useNativeDriver: false }),
      onPanResponderRelease: () => {

        pan.flattenOffset();
      }
    })
  ).current;

  const handleDraggableMenuAction = (subCategory) => {
    if (subCategory.sub_category_name === 'All') {
      setFilterType('All');
      setFilterData(restaurantItems);
    } else {
      setFilterType(subCategory.sub_category_name);
      const filteredItems = restaurantItems.filter(item =>
        item.sub_category_name === subCategory.sub_category_name
      );
      setFilterData(filteredItems);
    }
    setDraggableMenuVisible(false);
  };


  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleFilter = (item) => {
    if (item.type === "subcategory") {
      // toggle subcategory
      if (activeSubCategoryFilter === item.filter_name) {
        setActiveSubCategoryFilter(null); // deselect if clicked again
      } else {
        setActiveSubCategoryFilter(item.filter_name);
      }
    } else {
      // handle main Veg/Non Veg/All filter
      if (item.id === "all") {
        setSelectedFilter("All");
      } else {
        setSelectedFilter(item.filter_name);
      }
    }
  };


  const renderFilters = () => (
    <View>
      {/* Veg/Non-Veg Filters */}
      <FlatList
        data={allFilters.filter(f => f.type === 'filter_one' || f.id === 'all')}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => `${item.id}_${item.filter_name}_${index}`}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => {
          const isActive = selectedFilter === item.filter_name;
          return (
            <TouchableOpacity
              onPress={() => handleFilter(item)}
              style={[
                styles.filterButton,
                {
                  borderColor: isActive ? "#0EAF50" : '#8F8F8F',
                  backgroundColor: isActive ? "#0EAF50" : '#fff',
                }
              ]}
            >
              {item.filter_name !== "All" && (
                <HeaderPick2
                  color={
                    item.filter_name === "Veg"
                      ? (isActive ? "#fff" : "#0EAF50")
                      : "#CD2A2A"
                  }
                />
              )}
              <Text style={[styles.filterText, { color: isActive ? "#fff" : '#313131' }]}>
                {item.filter_name}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Subcategory Filters */}
      <FlatList
        data={allFilters.filter(f => f.type === 'subcategory')}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => `${item.id}_${item.filter_name}_${index}`}
        contentContainerStyle={[styles.filterList, { marginTop: 8 }]}
        renderItem={({ item }) => {
          const isActive = activeSubCategoryFilter === item.filter_name;
          return (
            <TouchableOpacity
              onPress={() => handleFilter(item)}
              style={[
                styles.filterButton,
                {
                  borderColor: isActive ? "#0EAF50" : '#8F8F8F',
                  backgroundColor: isActive ? "#0EAF50" : '#fff',
                }
              ]}
            >
              <Text style={[styles.filterText, { color: isActive ? "#fff" : '#313131' }]}>
                {item.filter_name}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );


  const renderItem = ({ item }) => {
    const isHighlighted = item.id === highlightedItemId;
    const scaleAnim = scaleAnims.get(item.id) || new Animated.Value(1);

    return (
      <Animated.View
        style={[
          styles.itemContainer,
          isHighlighted && styles.highlightedItem,
          { transform: [{ scale: scaleAnim }] }
        ]}
        onLayout={() => {
          if (isHighlighted && !renderedItems.has(item.id)) {
            setRenderedItems(prev => new Set(prev).add(item.id));
            scaleAnim.stopAnimation();
            requestAnimationFrame(() => {
              Animated.sequence([
                Animated.spring(scaleAnim, {
                  toValue: 1.1,
                  stiffness: 100,
                  damping: 7,
                  useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                  toValue: 1,
                  stiffness: 200,
                  damping: 10,
                  useNativeDriver: true,
                }),
              ]).start();
            });
          }
        }}
      >

        <View
          style={[styles.card, item.active_status === "1" && styles.unavailableCard]}
        >
          {/* Overlay when unavailable */}
          {item.active_status === "1" && (
            <View style={styles.unavailableOverlay}>
              <Text style={styles.unavailableText}>Currently Unavailable</Text>
            </View>
          )}



          {/* Details Right */}
          <View style={styles.itemDetails}>
            <View style={styles.itemHeader}>
              <HeaderPick2 color={item.filter_one === "Veg" ? "#0EAF50" : "#CD2A2A"} />
              <Text style={styles.itemName}>{item.item_name}</Text>
            </View>
            <Text style={styles.itemdescription}>{item.item_description}</Text>

            <View style={styles.itemFooter}>
              <View>
                {item.actual_price !== item.selling_price && (
                  <Text
                    style={[
                      styles.price,
                      {
                        textDecorationLine: "line-through",
                        color: "#888",
                        fontSize: 10,
                        textAlign: "left"
                      }
                    ]}
                  >
                    ₹{item.actual_price}
                  </Text>
                )}
                <Text style={styles.price}>₹{item.selling_price}</Text>
              </View>
            </View>

          </View>
          <View>
            <Image
              source={{ uri: item.item_image }}
              style={[
                styles.horizontalImage,
                item.active_status === "1" && styles.unavailableImage
              ]}
            />
            {cartItems.findIndex(value => value.id === item.id) !== -1 ? (
              <View style={styles.counterContainer}>
                <TouchableOpacity onPress={() => decreaseItem(item)}>
                  <AntDesign name="minus" size={20} color={commonStyles.appMainColor} />
                </TouchableOpacity>
                <Text style={styles.counterText}>
                  {cartItems.find(value => value.id === item.id).quantity}
                </Text>
                <TouchableOpacity onPress={() => handleAddToCart(item)}>
                  <AntDesign name="plus" size={20} color={commonStyles.appMainColor} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => handleAddToCart(item)}
              >
                <Text style={styles.addButtonText}>ADD</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>


      </Animated.View>
    );
  };

  useEffect(() => {
    return () => {
      scaleAnims.forEach(anim => anim.stopAnimation());
    };
  }, []);

  // Memoized cart calculations for better performance
  const cartCalculations = useMemo(() => {
    const itemCount = cartItems?.reduce((sum, item) => sum + Number(item.quantity), 0) || 0;
    const totalPrice = cartItems?.reduce((sum, item) => sum + (Number(item.selling_price) * Number(item.quantity)), 0) || 0;

    return {
      itemCount,
      totalPrice: totalPrice.toFixed(2),
      hasItems: itemCount > 0
    };
  }, [cartItems]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={true}
        nestedScrollEnabled={true}
      >
        <ImageBackground
          source={{ uri: route.params?.item?.shop_image }}
          style={styles.imageBackground}>
          <View style={styles.imageOverlay}>
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <MaterialCommunityIcons
                  name="keyboard-backspace"
                  size={30}
                  color="#fff"
                  style={styles.backIcon}
                />
              </TouchableOpacity>
              <View style={styles.header}>
                <Text style={styles.title}>{route.params?.item?.shop_name}</Text>
                <Text style={styles.subtitle}>{calculateDeliveryTime(route.params?.item?.distance.toFixed(1))} | {route.params?.item?.distance.toFixed(1)} km | {route.params?.item?.shop_address}</Text>
                {/* <View style={styles.ratingContainer}>
                  <Icon name="star" size={18} color="gold" />
                  <Text style={styles.rating}>{route.params?.item?.shop_rating}</Text>
                </View> */}
                <View style={{ backgroundColor: 'rgba(238, 235, 204, 0.20)', padding: 4, borderRadius: 4, width: 95 }}>
                  <StarRating rating={route.params?.item?.shop_rating} width={15} gap={4} />
                </View>
              </View>
              <View style={styles.headerIcons}>
                {/* <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={() => handleMenuAction('favorites')}
                >
                  <EvilIcons name="heart" color={'#000'} size={15} />
                </TouchableOpacity> */}
                {/* <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={() => setMenuVisible(!menuVisible)}
                >
                  <Entypo name="dots-three-vertical" color="#313131" size={7} />
                </TouchableOpacity> */}
              </View>
            </View>

            <View style={styles.searchContainer}>
              <View style={styles.inputWrapper}>
                <MaterialIcons
                  name="search"
                  size={24}
                  color="#666"
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search food items..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => setSearchQuery('')}
                  >
                    <MaterialIcons name="close" size={20} color="#666" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </ImageBackground>

        <View>
          {renderFilters()}
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={commonStyles.appMainColor} />
          </View>
        ) : filteredData?.length === 0 ? (
          <View style={styles.noItemsContainer}>
            <MaterialCommunityIcons name="food-off" size={50} color="#A3A3A3" />
            <Text style={styles.noItemsText}>No items found</Text>
            <Text style={styles.noItemsSubText}>We couldn't find any items matching your search</Text>
          </View>
        ) : (
          <View style={styles.itemListContainer}>
            <View style={styles.itemListContainer}>
              <FlatList
                ref={flatListRef}
                data={filteredData}
                keyExtractor={(item, index) => `${item.id}_${index}`}
                style={styles.itemList}
                contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 160 : 150 }}
                renderItem={renderItem}
                scrollEnabled={false}
                nestedScrollEnabled={true}
                // 👇 Remove grid props
                // numColumns={2}
                // columnWrapperStyle={styles.columnWrapper}
                onScrollToIndexFailed={({ index, averageItemLength }) => {
                  flatListRef.current?.scrollToOffset({
                    offset: index * averageItemLength,
                    animated: true
                  });
                  setTimeout(() => {
                    flatListRef.current?.scrollToIndex({ index, animated: true });
                  }, 100);
                }}
              />
            </View>

          </View>
        )}
      </ScrollView>




      {cartCalculations.hasItems && (
        <Animated.View
          style={styles.cartSummary(translateY)}
        >
          <TouchableOpacity
            onPress={() => navigation.navigate("CartScreen", { isFromRestaurant: true })}
            style={styles.cartSummaryButton}
            activeOpacity={0.8}
          >
            <View style={styles.cartSummaryContent}>
              <View style={styles.cartSummaryLeft}>
                <View style={styles.cartItemCountContainer}>
                  <Text style={styles.cartItemCount}>
                    {cartCalculations.itemCount}
                  </Text>
                </View>
                <View style={styles.cartTextContainer}>
                  <Text style={styles.cartSummaryText}>
                    Items in cart
                  </Text>
                  <Text style={styles.cartSummarySubText}>
                    ₹{cartCalculations.totalPrice}
                  </Text>
                </View>
              </View>
              <View style={styles.cartSummaryRight}>
                <Text style={styles.viewCartText}>View Cart</Text>
                <AntDesign name="right" color="#fff" size={16} />
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      <Modal
        visible={showReplaceModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancelReplace}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Replace Cart Items?</Text>
            <Text style={styles.modalText}>
              Your cart contains items from a different restaurant. Would you like to replace them with items from {route.params?.item?.shop_name}?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancelReplace}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleReplaceCart}
              >
                <Text style={styles.confirmButtonText}>Replace</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>

  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContainer: {
    flex: 1,
  },
  itemListContainer: {
    flex: 1,
    minHeight: 500, // Ensures FlatList has enough height to render properly

  },
  imageBackground: { width: responsiveWidth(100), height: responsiveHeight(30), },
  imageOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: responsiveHeight(1),
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  backIcon: { marginTop: 5 },
  header: { width: responsiveWidth(80), paddingVertical: 10, paddingHorizontal: responsiveWidth(0.5), alignSelf: 'flex-start', gap: 8 },
  title: { fontSize: responsiveFontSize(2.2), fontWeight: '700', color: '#fff', width: responsiveWidth(35) },
  subtitle: { fontSize: 14, color: '#F5F5F5', fontWeight: '500' },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  rating: { fontSize: 12, fontWeight: '700', color: '#fff' },
  headerIcons: { flexDirection: 'row', gap: 5, alignItems: 'center', marginTop: 10 },
  iconButton: { width: 18, height: 18, backgroundColor: '#fff', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 5,
    marginVertical: 10,
    height: 48,
    marginHorizontal: responsiveWidth(5),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    flex: 1,
  },
  searchIcon: {
    position: 'absolute',
    left: 15,
    zIndex: 1,
  },
  clearButton: {
    position: 'absolute',
    right: 15,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    padding: 5,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    paddingLeft: 45,
    paddingRight: 40,
    fontSize: 16,
    color: '#000',
  },
  filterList: { marginVertical: 5, paddingHorizontal: 10 },
  filterButton: {
    padding: 5,
    borderWidth: 1,
    borderRadius: 6,
    marginHorizontal: 3,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  filterText: { fontSize: 16, fontWeight: '500' },
  itemList: { paddingHorizontal: responsiveWidth(0), paddingBottom: responsiveHeight(5), flex: 1 },
  columnWrapper: { gap: responsiveWidth(3.5), justifyContent: 'space-between' },
  card: {
    flexDirection: 'row',  // horizontal layout
    backgroundColor: '#fff',
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    elevation: 1,
    width: '100%',
    alignItems: 'center',
    position: 'relative',   // needed for overlay
  },
  image: {
    width: responsiveWidth(40),
    height: responsiveHeight(17),
    borderRadius: 12,
    resizeMode: 'cover'
  },
  horizontalImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    resizeMode: 'cover',
    marginLeft: 12,
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'space-between',
    gap:6
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: "center",
    width: '100%',
    // marginTop: 5,
    gap: 5
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'left',
    flex: 1,
    color: '#000',
  },
  itemIcon: {
    marginTop: 3,
    marginLeft: 5,
  },
  itemRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    paddingHorizontal: 5,
    marginTop: 2,
  },
  itemRating: { color: '#000', fontSize: 14, fontWeight: '700', marginHorizontal: 1 },
  itemReviewCount: { color: '#3D3D3D', fontWeight: '400', fontSize: 12 },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 5,
    marginTop: 5,
  },
  price: { fontSize: 17, fontWeight: '700', color: "black" },
  itemdescription: { color: "gray" },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: commonStyles.appMainColor,
    marginTop: 10
  },
  counterText: { color: commonStyles.appMainColor, fontSize: 16, fontWeight: '700', marginHorizontal: 20 },
  addButton: {
    backgroundColor: '#FEF1E6',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#F8BE8A",
    marginTop: 10,
  },
  addButtonText: { color: commonStyles.appMainColor, textAlign: "center", fontWeight: '700', fontSize: 14 },
  draggableMenu: {
    position: 'absolute',
    backgroundColor: 'white',
    width: 68,
    height: 68,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 7,
    zIndex: 100,
    left: 20,
    bottom: 40,
  },
  menuText: { fontSize: 12, fontWeight: 700, color: commonStyles.appMainColor },
  menuButton: {
    backgroundColor: '#fffbe5',
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    justifyContent: "center", width: '100%'
  },
  menuContent: {
    position: 'absolute',
    bottom: 0,
    left: -205,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    elevation: 5,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    flexDirection: 'column'
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  menuItemText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#313131',
    fontWeight: '500',
  },
  activeMenuText: {
    fontWeight: '700',
  },
  cartSummary: (translateY) => ({
    position: "absolute",
    width: "100%",
    height: 65,
    bottom: Platform.OS === 'ios' ? 60 : 50, // Platform-specific bottom spacing
    backgroundColor: "#FE4A31",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginHorizontal: 16,
    width: "92%",
    alignSelf: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 10,
    transform: [{ translateY: translateY }],
  }),
  cartSummaryButton: {
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartSummaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  cartSummaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cartItemCountContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  cartItemCount: {
    fontSize: 16,
    fontWeight: '700',
    color: commonStyles.appMainColor,
  },
  cartTextContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  cartSummaryText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#fff',
  },
  cartSummarySubText: {
    fontSize: 11,
    fontWeight: '400',
    color: '#fff',
  },
  cartSummaryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  viewCartText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#fff',
  },
  menuOverlay: {
    position: 'absolute',
    top: responsiveHeight(15),
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    elevation: 5,
    zIndex: 1000,
    width: 200,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuOptionText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#313131',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  noItemsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
    padding: 20,
  },
  noItemsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#313131',
    marginTop: 15,
    marginBottom: 5,
  },
  noItemsSubText: {
    fontSize: 14,
    color: '#A3A3A3',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  confirmButton: {
    backgroundColor: commonStyles.appMainColor,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  unavailableCard: {
    opacity: 0.6,
    backgroundColor: '#f0f0f0',
  },
  unavailableImage: {
    opacity: 0.5,
  },
  unavailableOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  unavailableText: {
    color: '#ff4444',
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
  },
  highlightedItem: {
    backgroundColor: 'rgba(6, 94, 44, 0.1)',
    borderRadius: 8,
  },
});

export default RestaurantScreen;


// <View
// style={[styles.card, item.active_status === "1" && styles.unavailableCard]}
// >
// {item.active_status === "1" && (
//   <View style={styles.unavailableOverlay}>
//     <Text style={styles.unavailableText}>Currently Unavailable</Text>
//   </View>
// )}

// <Image
//   source={{ uri: item.item_image }}
//   style={[styles.image, item.active_status === "1" && styles.unavailableImage]}
// />

// <View style={styles.itemHeader}>
//   <Text style={styles.itemName}>{item.item_name}</Text>
//   <View style={styles.itemIcon}>
//     <HeaderPick2 color={item.filter_one === "Veg" ? "#0EAF50" : "#CD2A2A"} />
//   </View>
// </View>
// {/* 
// <View style={styles.itemRatingContainer}>
//   <Icon name="star" size={17} color="#D0A50F" />
//   <Text style={styles.itemRating}>4.7</Text>
//   <Text style={styles.itemReviewCount}>(12)</Text>
// </View> */}

// <View style={styles.itemFooter}>
//   <View>
//     <View style={{ flexDirection: 'row', justifyContent: "flex-start" }}>
//       {item.actual_price !== item.selling_price && (
//         <Text style={[styles.price, { textDecorationLine: 'line-through', color: '#888', fontSize: 10, textAlign: "left" }]}>₹{item.actual_price}</Text>
//       )}
//     </View>

//     <Text style={styles.price}>₹{item.selling_price}</Text>
//   </View>
//   {cartItems.findIndex(value => value.id === item.id) !== -1 ? (
//     <View style={styles.counterContainer}>
//       <TouchableOpacity onPress={() => decreaseItem(item)}>
//         <AntDesign name="minus" size={18} color={commonStyles.btn2Color} />
//       </TouchableOpacity>
//       <Text style={styles.counterText}>{cartItems.find(value => value.id === item.id).quantity}</Text>
//       <TouchableOpacity onPress={() => handleAddToCart(item)}>
//         <AntDesign name="plus" size={18} color={commonStyles.btn2Color} />
//       </TouchableOpacity>
//     </View>
//   ) : (
//     <TouchableOpacity
//       style={styles.addButton}
//       onPress={() => {
//         handleAddToCart(item);
//       }}
//     >
//       <Text style={styles.addButtonText}>ADD</Text>
//     </TouchableOpacity>
//   )}
// </View>
// </View>


// <FlatList
//     data={[
//       { sub_category_name: 'All', sub_category_id: 'all' },
//       ...restaurantItems?.reduce((acc, item) => {
//         if (
//           item.sub_category_name &&
//           !acc.find(cat => cat.sub_category_name === item.sub_category_name)
//         ) {
//           acc.push({
//             sub_category_name: item.sub_category_name,
//             sub_category_id: item.sub_category_id,
//           });
//         }
//         return acc;
//       }, []),
//     ]}
//     keyExtractor={item => item.sub_category_id?.toString() || 'all'}
//     horizontal
//     showsHorizontalScrollIndicator={false}
//     style={{ flexGrow: 0 }}   // ✅ prevents taking unnecessary height
//     contentContainerStyle={{
//       paddingHorizontal: 10,
//       paddingVertical: 6,     // ✅ keep row slim
//     }}
//     renderItem={({ item }) => (
//       <TouchableOpacity
//         style={{
//           flexDirection: 'row',
//           alignItems: 'center',
//           justifyContent: 'center',
//           marginRight: 10,
//           paddingHorizontal: 14,
//           paddingVertical: 6, // ✅ compact tab
//           borderRadius: 20,
//           backgroundColor:
//             filterType === item.sub_category_name || item.sub_category_name === 'All'
//               ? '#0EAF50'
//               : '#f0f0f0',
//         }}
//         onPress={() => handleDraggableMenuAction(item)}
//       >
//         <Text
//           style={{
//             fontSize: 14,
//             fontWeight: '500',
//             color:
//               filterType === item.sub_category_name || item.sub_category_name === 'All'
//                 ? '#fff'
//                 : '#333',
//             marginRight: filterType === item.sub_category_name ? 6 : 0,
//           }}
//         >
//           {item.sub_category_name}
//         </Text>
//         {filterType === item.sub_category_name && (
//           <MaterialIcons name="check" size={18} color="#fff" />
//         )}
//       </TouchableOpacity>
//     )}
//   />








// const renderFilters = () => (
//   <FlatList
//     data={allFilters}
//     horizontal
//     showsHorizontalScrollIndicator={false}
//     keyExtractor={item => item.id}
//     contentContainerStyle={styles.filterList}
//     renderItem={({ item }) => {
//       // const isActive = item.type === 'subcategory'
//       //   ? item.filter_name === activeSubCategoryFilter
//       //   : activeFilters.includes(item.filter_name);
//       const isActive = item.type === 'subcategory'
//         ? item.filter_name === activeSubCategoryFilter
//         : activeFilters.includes(item.filter_name);
//       return (
//         <TouchableOpacity
//           onPress={() => handleFilter(item)}
//           style={[
//             styles.filterButton,
//             {
//               borderColor: isActive ? "#0EAF50" : '#8F8F8F',
//               backgroundColor: isActive ? "#0EAF50" : '#fff',
//             }
//           ]}
//         >
//           {(item.type !== 'subcategory') && (
//             item.id !== "all" && <HeaderPick2 color={
//               item.filter_name === "Veg" ? (isActive ? "#fff" : "#0EAF50") :
//                 item.filter_name === "Non Veg" ? "#CD2A2A" : "#065E2C"
//             } />
//           )}
//           <Text style={[styles.filterText, { color: isActive ? "#fff" : '#313131' }]}>
//             {item.filter_name}
//           </Text>
//         </TouchableOpacity>
//       );
//     }}
//   />
// );



{/* 
      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.draggableMenu, pan.getLayout()]}
      >
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setDraggableMenuVisible(!draggableMenuVisible)}
        >
          <Text style={styles.menuText}>Menu</Text>
          <FontAwesome6 name="book-bookmark" color={commonStyles.btnColor} size={30} />
        </TouchableOpacity>

        {draggableMenuVisible && (
          <View style={styles.menuContent}>

            <FlatList
              data={[
                { sub_category_name: 'All', sub_category_id: 'all' },
                ...restaurantItems
                  ?.reduce((acc, item) => {
                    if (item.sub_category_name && !acc.find(cat => cat.sub_category_name === item.sub_category_name)) {
                      acc.push({
                        sub_category_name: item.sub_category_name,
                        sub_category_id: item.sub_category_id
                      });
                    }
                    return acc;
                  }, [])
              ]}
              keyExtractor={(item, index) => `${item.sub_category_id?.toString() || 'all'}_${item.sub_category_name}_${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleDraggableMenuAction(item)}
                >
                  <Text style={[
                    styles.menuItemText,
                    (filterType === item.sub_category_name || item.sub_category_name === 'All') && styles.activeMenuText
                  ]}>
                    {item.sub_category_name}
                  </Text>
                  {filterType === item.sub_category_name && (
                    <MaterialIcons name="check" size={20} color="#0EAF50" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </Animated.View> */}











{/* {menuVisible && (
        <View style={styles.menuOverlay}>
          <TouchableOpacity 
            style={styles.menuOption}
            onPress={() => handleMenuAction('favorites')}
          >
            <Icon name="favorite" size={24} color="#065E2C" />
            <Text style={styles.menuOptionText}>Add to Favorites</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.menuOption}
            onPress={() => handleMenuAction('share')}
          >
            <Icon name="share" size={24} color="#065E2C" />
            <Text style={styles.menuOptionText}>Share Restaurant</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.menuOption}
            onPress={() => handleMenuAction('report')}
          >
            <Icon name="report-problem" size={24} color="#065E2C" />
            <Text style={styles.menuOptionText}>Report an Issue</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.menuOption}
            onPress={() => handleMenuAction('info')}
          >
            <Icon name="info" size={24} color="#065E2C" />
            <Text style={styles.menuOptionText}>Restaurant Info</Text>
          </TouchableOpacity>
        </View>
      )} */}