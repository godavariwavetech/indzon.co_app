import React, {useEffect, useRef, useState} from 'react';
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
import {useDispatch, useSelector} from 'react-redux';
import {
  addToCart,
  getItemsList,
  removeFromCart,
  setCartRestaurant,
} from '../../redux/reducers/daddy';
import {setRestaurnatDetails} from '../../redux/reducers/auth';
import {indiviadualShop} from '../../redux/reducers/addressSlice';
import { getSingleShopDetails } from '../../redux/reducers/search';
import commonStyles from '../../commonstyles/CommonStyles';

const BannerRestaurantScreen = ({navigation, route}) => {
  const [translateY] = useState(new Animated.Value(100));
  const dispatch = useDispatch();
  const {restaurantItems, cartItems, cartRestaurant} = useSelector(
    state => state.Dashboard,
  );
  const [filterType, setFilterType] = useState('All');
  const [filteredData, setFilterData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState(['All']);
  const pan = useRef(
    new Animated.ValueXY({
      x: responsiveWidth(100) - 88,
      y: responsiveHeight(100) - 138,
    }),
  ).current;
  const [draggableMenuVisible, setDraggableMenuVisible] = useState(false);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const timeoutRef = useRef();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [restaurantData, setRestaurantData] = useState(null);
  const {location} = useSelector(state => state.Auth);
  // const [bottomGap,setBottomGap] = useState(0)
  const bottomGap = new Animated.Value(0);
  const flatListRef = useRef(null);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;




  const fetchRestaurantData = async () => {
    if(route?.params?.fromSearch) {
      if (!route?.params?.id) return;
      const response = await dispatch(getSingleShopDetails({shopId: route?.params?.id}));
      setRestaurantData(response?.payload.data[0])
      return
    }
    if (!route?.params?.shopId) return;
    const response = await dispatch(indiviadualShop({shopId: route?.params?.shopId}));
    setRestaurantData(response.payload.data[0][0]);
  };

  useEffect(() => {
    fetchRestaurantData();
  }, [location, route?.params?.shopId]);

  const mergedFilters = [
    {filter_name: 'All', id: 'all'},
    ...[
      ...new Set(
        (restaurantItems || []).map(item => item.filter_one).filter(Boolean),
      ),
    ].map(filterName => ({
      filter_name: filterName,
      id: filterName.toLowerCase().replace(' ', '-'),
    })),
  ];

  const getItems = async () => {
    try {
      setIsLoading(true);

      const response = await dispatch(
        getItemsList({
          shopId: restaurantData?.shop_id,
          shopItem: restaurantData?.shop_items_tb_nm,
        }),
      );
      setFilterData(response.payload.data);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilter = (selected) => {
    if (selected.type === 'subcategory') {
      setActiveSubCategoryFilter(selected.filter_name === 'All' ? 'All' : selected.filter_name);
    } else {


    setActiveFilters([selected.filter_name]);
      // if (selected.filter_name === 'All') {
      //   setActiveFilters(['All']);
      //   return;
      // }
      // const newFilters = activeFilters.includes(selected.filter_name) 
      //   ? activeFilters.filter(f => f !== selected.filter_name)
      //   : [...activeFilters.filter(f => f !== 'All'), selected.filter_name];
      // setActiveFilters(newFilters);
    }
  };

  useEffect(() => {
    if (!restaurantItems) return;
    const filtered = restaurantItems.filter(item => {
      const matchesSearch =
        item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.item_description
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesFilters =
        activeFilters.includes('All') ||
        activeFilters.includes(item.filter_one);

      const matchesMenu =
        filterType === 'All' || item.sub_category_name === filterType;

      return matchesSearch && matchesFilters && matchesMenu;
    });

    setFilterData(filtered);
  }, [searchQuery, activeFilters, restaurantItems, filterType]);

  useEffect(() => {
    restaurantData && getItems();
  }, [restaurantData]);

  const showToastMessage = (message, itemId) => {
    toastAnim.setValue(0);
    progressAnim.setValue(0);

    setToastMessage(message);
    setShowToast(true);

    // Scroll to item
    const index = filteredData.findIndex(item => item.id === itemId);
    if (index !== -1 && flatListRef.current) {
      // setTimeout(() => {
      //   flatListRef.current?.scrollToIndex({
      //     index,
      //     viewOffset: 100,
      //     animated: true,
      //   });
      // }, 500); // Delay to allow toast animation
    }

    Animated.timing(toastAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 4000,
      useNativeDriver: false,
    }).start();
  };

  useEffect(() => {
    if (route?.params?.shopItem) {
      const itemId = route.params?.shopItem;
      const item = filteredData.find(item => item.id === itemId);

      if (item) {
        showToastMessage(
          {
            name: item.item_name,
            offer: `${item.discount_percentage}%` || '20%',
            original: item.actual_price,
            discounted: item.selling_price,
          },
          itemId,
        );
      }
    }
  }, [route?.params, filteredData]);

  useEffect(() => {
    if (showToast) {
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: false,
      }).start();
    }
  }, [showToast]);

  const handleAddToCart = item => {
   
    if (cartItems.length === 0 || cartRestaurant == restaurantData?.shop_id) {
      addItem(item);
      dispatch(setRestaurnatDetails(restaurantData));
    } else {
      setSelectedItem(item);
      setShowReplaceModal(true);
    }
  };

  const handleReplaceCart = () => {
    dispatch(setCartRestaurant(restaurantData?.shopId));
    dispatch(addToCart(selectedItem));
    setShowReplaceModal(false);
    setSelectedItem(null);
  };

  const handleCancelReplace = () => {
    setShowReplaceModal(false);
    setSelectedItem(null);
  };



  const startAnim = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(bottomGap, {
        toValue: responsiveHeight(10),
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const stopAnim = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 100,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(bottomGap, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };
  const addItem = item => {
    dispatch(addToCart(item));
  };

  const decreaseItem = item => {
    dispatch(removeFromCart(item));
  };

  useEffect(() => {
    Object.keys(cartItems).length > 0 ? startAnim() : stopAnim();
  }, [Object.keys(cartItems).length]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
       
        pan.setOffset({x: pan.x._value, y: pan.y._value});
        pan.setValue({x: 0, y: 0});
      },
      onPanResponderMove: Animated.event([null, {dx: pan.x, dy: pan.y}], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    }),
  ).current;


  const handleDraggableMenuAction = subCategory => {
    if (subCategory.sub_category_name === 'All') {
      setFilterType('All');
      setFilterData(restaurantItems);
    } else {
      setFilterType(subCategory.sub_category_name);
      const filteredItems = restaurantItems.filter(
        item => item.sub_category_name === subCategory.sub_category_name,
      );
      setFilterData(filteredItems);
    }
    setDraggableMenuVisible(false);
  };

  const getShopDetails = async () => {
    try {
      dispatch(getSingleShopDetails({shopId: route?.params?.shopId}));
    } catch (error) {
      console.error('Error fetching shop details:', error);
    }
  }

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, []);

  const renderFilters = () => (
    <FlatList
      data={mergedFilters}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.filterList}
      renderItem={({item}) => {
        const isActive =
          item.type === 'subcategory'
            ? item.filter_name === activeSubCategoryFilter
            : activeFilters.includes(item.filter_name);

        return (
          <TouchableOpacity
            onPress={() => handleFilter(item)}
            style={[
              styles.filterButton,
              {
                borderColor: isActive ? '#0EAF50' : '#8F8F8F',
                backgroundColor: isActive ? '#0EAF50' : '#fff',
              },
            ]}>
            {item.type !== 'subcategory' && (
              <HeaderPick2
                color={
                  item.filter_name === 'Veg'
                    ? isActive
                      ? '#fff'
                      : '#0EAF50'
                    : item.filter_name === 'Non Veg'
                    ? '#CD2A2A'
                    : '#065E2C'
                }
              />
            )}
            <Text
              style={[
                styles.filterText,
                {color: isActive ? '#fff' : '#313131'},
              ]}>
              {item.filter_name}
            </Text>
          </TouchableOpacity>
        );
      }}
    />
  );

  const renderItem = ({item}) => {
    return (
      <View style={styles.itemContainer}>
        <View
          style={[
            styles.card,
            item.active_status === '1' && styles.unavailableCard,
          ]}>
          {item.active_status === '1' && (
            <View style={styles.unavailableOverlay}>
              <Text style={styles.unavailableText}>Currently Unavailable</Text>
            </View>
          )}

          <Image
            source={{uri: item.item_image}}
            style={[
              styles.image,
              item.active_status === '1' && styles.unavailableImage,
            ]}
          />

          <View style={styles.itemHeader}>
            <Text style={styles.itemName}>{item.item_name}</Text>
            <View style={styles.itemIcon}>
              <HeaderPick2
                color={item.filter_one === 'Veg' ? '#0EAF50' : '#CD2A2A'}
              />
            </View>
          </View>

          {/* <View style={styles.itemRatingContainer}>
            <Icon name="star" size={17} color="#D0A50F" />
            <Text style={styles.itemRating}>4.7</Text>
            <Text style={styles.itemReviewCount}>(12)</Text>
          </View> */}

          <View style={styles.itemFooter}>
          <View>
            <View style={{flexDirection: 'row',justifyContent:"flex-start"}}>
              {item.actual_price !== item.selling_price && (
                <Text style={[styles.price, {textDecorationLine: 'line-through', color: '#888',fontSize:10,textAlign:"left"}]}>₹{item.actual_price}</Text>
              )}
              </View>

              <Text style={styles.price}>₹{item.selling_price}</Text>
            </View>
            {cartItems.findIndex(value => value.id === item.id) !== -1 ? (
              <View style={styles.counterContainer}>
                <TouchableOpacity onPress={() => decreaseItem(item)}>
                  <AntDesign name="minus" size={18} color="#065E2C" />
                </TouchableOpacity>
                <Text style={styles.counterText}>
                  {cartItems.find(value => value.id === item.id).quantity}
                </Text>
                <TouchableOpacity onPress={() => handleAddToCart(item)}>
                  <AntDesign name="plus" size={18} color="#065E2C" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  handleAddToCart(item);
                }}>
                <Text style={styles.addButtonText}>ADD</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* <StatusBar backgroundColor="transparent" translucent /> */}
      <ImageBackground
        source={{uri: restaurantData?.shop_image}}
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
              <Text style={styles.title}>{restaurantData?.shop_name}</Text>
              <Text style={styles.subtitle}>
                {restaurantData?.shop_address}
              </Text>
              <View style={styles.ratingContainer}>
                <Icon name="star" size={18} color="gold" />
                <Text style={styles.rating}>{restaurantData?.shop_rating}</Text>
              </View>
            </View>
            <View style={styles.headerIcons}></View>
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
                  onPress={() => setSearchQuery('')}>
                  <MaterialIcons name="close" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </ImageBackground>

      <View>{renderFilters()}</View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#065E2C" />
        </View>
      ) : filteredData?.length === 0 ? (
        <View style={styles.noItemsContainer}>
          <MaterialCommunityIcons name="food-off" size={50} color="#A3A3A3" />
          <Text style={styles.noItemsText}>No items found</Text>
          <Text style={styles.noItemsSubText}>
            We couldn't find any items matching your search
          </Text>
        </View>
      ) : (
        <Animated.View style={{flex: 1, paddingBottom: bottomGap}}>
          <FlatList
            ref={flatListRef}
            data={filteredData}
            keyExtractor={item => item.id}
            numColumns={2}
            style={[styles.itemList]}
            columnWrapperStyle={styles.columnWrapper}
            renderItem={renderItem}
            onScrollToIndexFailed={({index, averageItemLength}) => {
              flatListRef.current?.scrollToOffset({
                offset: index * averageItemLength,
                animated: true,
              });
              setTimeout(() => {
                flatListRef.current?.scrollToIndex({index, animated: true});
              }, 100);
            }}
          />
        </Animated.View>
      )}

      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.draggableMenu, pan.getLayout()]}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setDraggableMenuVisible(!draggableMenuVisible)}>
          <Text style={styles.menuText}>Menu</Text>
          <FontAwesome6 name="book-bookmark" color="#065E2C" size={30} />
        </TouchableOpacity>

        {draggableMenuVisible && (
          <View style={styles.menuContent}>
            <FlatList
              data={[
                {sub_category_name: 'All', sub_category_id: 'all'},
                ...restaurantItems?.reduce((acc, item) => {
                  if (
                    item.sub_category_name &&
                    !acc.find(
                      cat => cat.sub_category_name === item.sub_category_name,
                    )
                  ) {
                    acc.push({
                      sub_category_name: item.sub_category_name,
                      sub_category_id: item.sub_category_id,
                    });
                  }
                  return acc;
                }, []),
              ]}
              keyExtractor={item => item.sub_category_id?.toString() || 'all'}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleDraggableMenuAction(item)}>
                  <Text
                    style={[
                      styles.menuItemText,
                      (filterType === item.sub_category_name ||
                        item.sub_category_name === 'All') &&
                        styles.activeMenuText,
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
      </Animated.View>

        <Animated.View style={styles.cartSummary(translateY)}>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('CartScreen', {isFromRestaurant: true})
            }>
            <Text style={styles.cartSummaryText}>
              {Object.keys(cartItems).length} Items added to cart{' '}
              <AntDesign name="right" color="green" size={17} />{' '}
            </Text>
          </TouchableOpacity>
        </Animated.View>

      <Modal
        visible={showReplaceModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancelReplace}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Replace Cart Items?</Text>
            <Text style={styles.modalText}>
              Your cart contains items from a different restaurant. Would you
              like to replace them with items from {restaurantData?.shop_name}?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancelReplace}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleReplaceCart}>
                <Text style={styles.confirmButtonText}>Replace</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {showToast && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}>
          <View style={styles.toastContent}>
            <MaterialIcons name="local-offer" size={24} color="#fff" />

            <View style={styles.toastTextContainer}>
              <Text style={styles.toastTitle}>{toastMessage.name}</Text>
              <Text style={styles.toastDetails}>
                {toastMessage.offer} OFF •
                <Text style={styles.originalPrice}>
                  {' '}
                  ₹{toastMessage.original}
                </Text>
                {' → '}
                <Text style={styles.discountedPrice}>
                  ₹{toastMessage.discounted}
                </Text>
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                Animated.timing(toastAnim, {
                  toValue: 0,
                  duration: 200,
                  useNativeDriver: true,
                }).start(() => setShowToast(false));
              }}
              style={styles.closeButton}>
              <MaterialIcons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  imageBackground: {width: responsiveWidth(100), height: responsiveHeight(30)},
  imageOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: responsiveHeight(1),
  },
  headerRow: {flexDirection: 'row', alignItems: 'flex-start'},
  backIcon: {marginTop: 5},
  header: {
    width: responsiveWidth(70),
    paddingVertical: 10,
    paddingHorizontal: responsiveWidth(1),
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: responsiveFontSize(2.2),
    fontWeight: '700',
    color: '#fff',
    width: responsiveWidth(35),
  },
  subtitle: {fontSize: 14, color: '#F5F5F5', fontWeight: '500'},
  ratingContainer: {flexDirection: 'row', alignItems: 'center', marginTop: 5},
  rating: {fontSize: 12, fontWeight: '700', color: '#fff'},
  headerIcons: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  iconButton: {
    width: 18,
    height: 18,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
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
  filterList: {marginVertical: 5, paddingHorizontal: 15},
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
  filterText: {fontSize: 16, fontWeight: '500'},
  itemList: {
    paddingHorizontal: responsiveWidth(5),
    paddingBottom: responsiveHeight(5),
    flex: 1,
  },
  columnWrapper: {gap: responsiveWidth(3.5), justifyContent: 'space-between'},
  card: {
    backgroundColor: '#fff',
    marginBottom: responsiveHeight(1),
    padding: 7,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    width: responsiveWidth(45),
  },
  image: {
    width: responsiveWidth(40),
    height: responsiveHeight(15),
    borderRadius: 12,
    resizeMode: 'cover',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 5,
    paddingHorizontal: 5,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'left',
    flex: 1,
    color: '#000',
    marginRight: 5,
    height:responsiveHeight(4)
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
  itemRating: {color: '#000'},
  itemReviewCount: {color: '#3D3D3D', fontWeight: '400', fontSize: 12},
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 5,
    marginTop: 5,
  },
  price: {fontSize: 17, fontWeight: '700', color: '#065E2C'},
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#065E2C',
  },
  counterText: {
    color: '#065E2C',
    fontSize: 16,
    fontWeight: '700',
    marginHorizontal: 10,
  },
  addButton: {
    backgroundColor: '#fff',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#065E2C',
  },
  addButtonText: {color: '#065E2C', fontWeight: '700', fontSize: 14},
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
  menuText: {fontSize: 12, fontWeight: 700, color: '#065E2C'},
  menuButton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
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
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    flexDirection: 'column',
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
  cartSummary: translateY => ({
    position: 'absolute',
    width: '100%',
    height: 75,
    bottom: 0,
    backgroundColor: '#FFF8CF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
    zIndex: 10,
    transform: [{translateY: translateY}],
  }),
  cartSummaryText: {fontSize: 18, fontWeight: 'bold'},
  cartSummarySubText: {fontSize: 14, color: 'gray', marginVertical: 5},
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
  toastContainer: {
    position: 'absolute',
    top: 50,
    left: 15,
    right: 15,
    backgroundColor: '#065E2C',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'column',
    elevation: 5,
    zIndex: 9999,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  toastTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  toastTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  toastDetails: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    marginBottom: 2,
  },
  toastTime: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  testButton: {
    position: 'absolute',
    top: 100,
    zIndex: 9999,
    backgroundColor: 'red',
    padding: 10,
  },
  originalPrice: {
    textDecorationLine: 'line-through',
    color: 'rgba(255,255,255,0.6)',
    marginRight: 4,
  },
  discountedPrice: {
    color: '#fff',
    fontWeight: '700',
  },
});

export default BannerRestaurantScreen;
