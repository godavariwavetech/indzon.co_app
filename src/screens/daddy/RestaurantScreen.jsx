import React, { useEffect, useRef, useState, useMemo, memo } from 'react';
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
  const [activeSubCategoryFilter, setActiveSubCategoryFilter] = useState(null);

  const allFilters = useMemo(() => [
    { filter_name: 'All', id: 'all', type: 'general' },
    ...[...new Set((restaurantItems || []).map(item => item.filter_one).filter(Boolean))]
      .map(f => ({ filter_name: f, id: f.toLowerCase().replace(/\s+/g, '-'), type: 'filter_one' })),
    ...[...new Set((restaurantItems || []).map(item => item.sub_category_name).filter(Boolean))]
      .map(sc => ({ filter_name: sc, id: sc.toLowerCase().replace(/\s+/g, '-'), type: 'subcategory' })),
  ], [restaurantItems]);

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
  };

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
  }, [route.params]);

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
      return () => clearTimeout(timer);
    }
  }, [route.params]);

  const calculateDeliveryTime = (distance) => {
    if (distance < 3) return '15-20 mins';
    if (distance < 5) return '20-30 mins';
    return '30-45 mins';
  };

  const addItem = (item) => {
    dispatch(addToCart(item))
  }

  const decreaseItem = (item) => {
    dispatch(removeFromCart(item))
  }

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

  useEffect(() => {
    Object.keys(cartItems).length > 0 ? startAnim() : stopAnim()
  }, [Object.keys(cartItems).length]);

  const handleFilter = (item) => {
    if (item.type === "subcategory") {
      if (activeSubCategoryFilter === item.filter_name) {
        setActiveSubCategoryFilter(null);
      } else {
        setActiveSubCategoryFilter(item.filter_name);
      }
    } else {
      if (item.id === "all") {
        setSelectedFilter("All");
      } else {
        setSelectedFilter(item.filter_name);
      }
    }
  };

  const renderFilters = () => (
    <View>
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

  const RenderItem = memo(({ item, isHighlighted, scaleAnim, isInCart, quantity, onAdd, onRemove }) => {
    return (
      <Animated.View
        style={[
          styles.itemContainer,
          isHighlighted && styles.highlightedItem,
          { transform: [{ scale: scaleAnim }] }
        ]}
      >
        <View
          style={[styles.card, item.active_status === "1" && styles.unavailableCard]}
        >
          {item.active_status === "1" && (
            <View style={styles.unavailableOverlay}>
              <Text style={styles.unavailableText}>Currently Unavailable</Text>
            </View>
          )}

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
            {isInCart ? (
              <View style={styles.counterContainer}>
                <TouchableOpacity onPress={() => onRemove(item)}>
                  <AntDesign name="minus" size={20} color={commonStyles.appMainColor} />
                </TouchableOpacity>
                <Text style={styles.counterText}>
                  {quantity}
                </Text>
                <TouchableOpacity onPress={() => onAdd(item)}>
                  <AntDesign name="plus" size={20} color={commonStyles.appMainColor} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => onAdd(item)}
              >
                <Text style={styles.addButtonText}>ADD</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Animated.View>
    );
  });

  const renderItem = ({ item }) => {
    const isHighlighted = item.id === highlightedItemId;
    const scaleAnim = scaleAnims.get(item.id) || new Animated.Value(1);
    const cartItem = cartItems.find(v => v.id === item.id);

    return (
      <RenderItem 
        item={item}
        isHighlighted={isHighlighted}
        scaleAnim={scaleAnim}
        isInCart={!!cartItem}
        quantity={cartItem?.quantity || 0}
        onAdd={handleAddToCart}
        onRemove={decreaseItem}
      />
    );
  };

  const cartCalculations = useMemo(() => {
    const itemCount = cartItems?.reduce((sum, item) => sum + Number(item.quantity), 0) || 0;
    const totalPrice = cartItems?.reduce((sum, item) => sum + (Number(item.selling_price) * Number(item.quantity)), 0) || 0;
    return {
      itemCount,
      totalPrice: totalPrice.toFixed(2),
      hasItems: itemCount > 0
    };
  }, [cartItems]);

  const ListHeader = useMemo(() => (
    <View>
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
              <View style={{ backgroundColor: 'rgba(238, 235, 204, 0.20)', padding: 4, borderRadius: 4, width: 95 }}>
                <StarRating rating={route.params?.item?.shop_rating} width={15} gap={4} />
              </View>
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
    </View>
  ), [route.params, searchQuery, selectedFilter, activeSubCategoryFilter, allFilters]);

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={commonStyles.appMainColor} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={filteredData}
          keyExtractor={(item, index) => `${item.id}_${index}`}
          style={styles.itemList}
          contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 160 : 150 }}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={!isLoading && filteredData?.length === 0 ? (
            <View style={styles.noItemsContainer}>
              <MaterialCommunityIcons name="food-off" size={50} color="#A3A3A3" />
              <Text style={styles.noItemsText}>No items found</Text>
              <Text style={styles.noItemsSubText}>We couldn't find any items matching your search</Text>
            </View>
          ) : null}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
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
      )}

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
