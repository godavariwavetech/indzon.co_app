import React, { useState, useCallback, useRef } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, StatusBar, Image, ActivityIndicator, Modal, KeyboardAvoidingView, Platform, ScrollView, RefreshControl } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ReorderInactive from './tabassets/ReorderInactive';
import HeaderPick2 from './tabassets/HeaderPick2';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import { getOrderDetails, getOrders, addToCart, removeFromCart, setCartRestaurant } from '../../redux/reducers/daddy';
import { useFocusEffect } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { globalSearch } from '../../redux/reducers/addressSlice';
import commonStyles from '../../commonstyles/CommonStyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ReorderScreen = ({ navigation }) => {
  const [expandedRestaurants, setExpandedRestaurants] = useState({});
  const [orderItems, setOrderItems] = useState({});
  const [loading, setLoading] = useState({});
  const { orders, cartItems, cartRestaurant } = useSelector((state) => state.Dashboard);
  const dispatch = useDispatch();
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const insets = useSafeAreaInsets();

  // New state for search query
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const timeoutRef = useRef();
  const { globalSearchResults } = useSelector(state => state.address);
  const [isLoading, setIsLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const getOrdersData = async () => {
    try {
      setInitialLoading(true);
      setLoadError('');
      const response = await dispatch(getOrders({ orderId: 0 }));
      if (!getOrders.fulfilled.match(response)) {
        setLoadError('Unable to load your orders. Tap Retry to try again.');
      }
    } catch (error) {
      setLoadError('Unable to load your orders. Tap Retry to try again.');
      console.error('Error loading orders:', error);
    } finally {
      setInitialLoading(false);
    }
  }

  const fetchOrderItems = async (orderId) => {
    try {
      setLoading(prev => ({ ...prev, [orderId]: true }));
      const response = await dispatch(getOrderDetails({ orderId }));

      if (response.payload && response.payload.data) {
        setOrderItems(prev => ({
          ...prev,
          [orderId]: response.payload.data
        }));

        setExpandedRestaurants(prev => ({
          ...prev,
          [orderId]: true
        }));
      } else {
        console.error('Invalid response format:', response);
      }
    } catch (error) {
      console.error('Error fetching order items:', error);
    } finally {
      setLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const toggleExpand = useCallback((restaurantId) => {
    setExpandedRestaurants(prev => ({
      ...prev,
      [restaurantId]: !prev[restaurantId]
    }));
  }, []);

  const handleAddToCart = (item) => {
    if (cartItems.length === 0 || cartRestaurant === item.shop_id) {
      addItem(item);
    } else {
      setSelectedItem(item);
      setShowReplaceModal(true);
    }
  };

  const handleReplaceCart = () => {
    dispatch(setCartRestaurant(selectedItem.shop_id));
    dispatch(addToCart(selectedItem));
    setShowReplaceModal(false);
    setSelectedItem(null);
  };

  const handleCancelReplace = () => {
    setShowReplaceModal(false);
    setSelectedItem(null);
  };

  const addItem = (item) => {
    dispatch(addToCart(item));
  };

  const decreaseItem = (item) => {
    dispatch(removeFromCart(item));
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    clearTimeout(timeoutRef.current);

    if (query.trim()) {
      timeoutRef.current = setTimeout(() => {
        dispatch(globalSearch({ searchText: query }));
      }, 500);
    }
  };


  const filteredOrders = orders?.filter(order =>
    !searchQuery.trim() ||
    globalSearchResults?.some(result => result.shop_name === order.shop_name) ||
    (order.shop_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await getOrdersData();
    setRefreshing(false);
  };

  const renderMenuItem = useCallback(({ item }) => {
    const indexValue = cartItems.findIndex(value => value.id === item.id);
    const eachPrice = Number(item.item_price) * Number(cartItems[indexValue]?.quantity);

    return (
      <View>
        <View style={styles.cartItem}>
          <View style={styles.itemDetails}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <HeaderPick2 />
              <Text style={styles.foodName}>{item.item_name}</Text>
            </View>
            <Text style={styles.foodPrice}>₹ {item.item_price}</Text>
            <Text style={styles.itemDescription}>{item.item_description}</Text>
          </View>
          {/* <View>
            {indexValue !== -1 ? (
              <View style={styles.counterContainer}>
                <TouchableOpacity onPress={() => decreaseItem(item)}>
                  <AntDesign name="minus" size={18} color="#065E2C" />
                </TouchableOpacity>
                <Text style={styles.counterText}>{cartItems[indexValue]?.quantity}</Text>
                <TouchableOpacity onPress={() => handleAddToCart(item)}>
                  <AntDesign name="plus" size={18} color="#065E2C" />
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
            {indexValue !== -1 && <Text style={styles.itemTotalPrice}>₹ {eachPrice}</Text>}
          </View> */}
        </View>
        <View style={styles.dottedLineContainer}>
          {Array(20).fill(0).map((_, index) => (
            <View key={index} style={styles.dot} />
          ))}
        </View>
      </View>
    );
  }, [cartItems, cartRestaurant]);

  // Add this constant near the top of the file
  const STATUS_MAP = {
    0: 'Order Placed',
    1: 'Order Accepted',
    2: 'Order On The Way',
    3: 'Order Completed',
    4: 'Order Cancelled by You',
    5: 'Order Rejected by Restaurant',
    6: 'Order Not Received',
    7: 'Waiting for Payment',
    8: 'Delivery Partner Assigned',
  };

  // Add this function to get status color
  const getStatusColor = (status) => {
    const colorMap = {
      0: '#C3A710', // Order Placed - Yellow
      1: '#065E2C', // Order Accepted - Green
      2: '#065E2C', // Preparing - Green
      3: '#065E2C', // Completed - Green
      4: '#FF4B4B', // Cancelled - Red
      5: '#FF4B4B', // Rejected - Red
      6: '#FF4B4B', // Not Received - Red
      7: '#C3A710', // Waiting Payment - Yellow
      8: '#065E2C', // Delivery Assigned - Green
    };
    return colorMap[status] || '#666'; // Default gray
  };


  console.log(filteredOrders,">>>>>>>>>>>>>>>>>>>>filteredOrders");

  // Update the renderRestaurantCard function to include status
  const renderRestaurantCard = useCallback(({ item }) => {
    const cardLoading = loading[item.id];
    const statusColor = getStatusColor(item.order_status);
    const statusLabel = STATUS_MAP[item.order_status];

    return (
      <TouchableOpacity
        activeOpacity={0.95}
        style={styles.card}
        onPress={() => navigation.navigate('OrderDetails', { orderDetails: item })}
        disabled={cardLoading}
      >
        {/* Top row: image + order id + status badge */}
        <View style={styles.cardTopRow}>
          <View style={styles.shopImageWrapper}>
            <Image source={{ uri: item.shop_image }} style={styles.shopImage} />
          </View>
          <View style={styles.orderMeta}>
            <Text style={styles.orderIdLabel}>Order ID:</Text>
            <Text style={styles.orderIdValue} numberOfLines={1}>#{item.order_id}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <MaterialIcons name="check-circle" size={14} color="#fff" />
              <Text style={styles.statusBadgeText}>{statusLabel}</Text>
            </View>
          </View>
        </View>

        {/* Date & Total row */}
        <View style={styles.dateAmountRow}>
          <View>
            <Text style={styles.metaLabel}>Date & Time:</Text>
            <Text style={styles.metaValue}>{item.order_date}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.metaLabel}>Total Amount:</Text>
            <Text style={styles.metaValue}>₹{item.grand_total}/-</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Delivery Address */}
        <View style={styles.addressSection}>
          <View style={styles.addressHeader}>
            <Text style={styles.addressIcon}>📍</Text>
            <Text style={styles.addressTitle}>Delivery Address</Text>
          </View>
          <Text style={styles.addressText}>{item.delivery_address}</Text>
        </View>

        <View style={styles.divider} />

        {/* Restaurant Address */}
        <View style={styles.addressSection}>
          <View style={styles.addressHeader}>
            <Text style={styles.addressIcon}>🏪</Text>
            <Text style={styles.addressTitle}>Restaurant Address</Text>
          </View>
          <Text style={styles.addressText}>{item.shop_address || item.shop_name}</Text>
        </View>
      </TouchableOpacity>
    );
  }, [loading, navigation]);

  const keyExtractor = useCallback((item) => String(item.id), []);

  useFocusEffect(
    useCallback(() => {
      setExpandedRestaurants({});
      setOrderItems({});
      getOrdersData();
    }, [])
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* <LinearGradient colors={['#FD0', '#F7F2F2']} style={styles.gradientContainer}> */}
      {/* <LinearGradient colors={['#FE4A31', '#FFD6CD']} style={styles.gradientContainer}> */}
      <LinearGradient colors={['#D14A00', '#6C2600']} style={[ styles.gradientHeader,{ paddingTop: insets.top+10 }]}>
        <View style={styles.headerContainer}>
          <ReorderInactive color='#fff' />
          <Text style={styles.headerTitle}>Orders</Text>
        </View>
        <View style={styles.searchContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              placeholderTextColor={'#666666'}
              placeholder="Search for your favorites"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={handleSearch}
              selectionColor={commonStyles.appMainColor}
            />
            <Icon name="search" size={24} color="gray" style={styles.searchIcon} />
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
      </LinearGradient>
      {initialLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={commonStyles.appMainColor} />
        </View>
      ) : loadError ? (
        <View style={styles.emptyListContainer}>
          <Text accessibilityRole="alert" style={styles.emptyListText}>{loadError}</Text>
          <TouchableOpacity accessibilityRole="button" onPress={getOrdersData}>
            <Text style={styles.emptyListText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredOrders?.length > 0 ? (
        <FlatList
          data={filteredOrders}
          renderItem={renderRestaurantCard}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContainer}
          removeClippedSubviews={true}
          maxToRenderPerBatch={3}
          windowSize={5}
          initialNumToRender={5}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <View style={styles.emptyListContainer}>
          <Text style={styles.emptyListText}>No orders found.</Text>
        </View>
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
              Your cart contains items from a different restaurant. Would you like to replace them with items from {selectedItem?.shop_name}?
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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    // paddingBottom: 60
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    // marginTop: responsiveHeight(5),
    marginLeft: responsiveWidth(5)
  },
  gradientHeader:{
    borderBottomLeftRadius:20,
    borderBottomRightRadius:20,
    paddingBottom:10
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700"
  },
  searchContainer: {
    marginHorizontal: responsiveWidth(5),
    marginTop: responsiveHeight(2),
    marginBottom: responsiveHeight(1),
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 5,
    height: 48,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    flex: 1,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    paddingLeft: 45,
    paddingRight: 40,
    fontSize: 16,
    color: '#000',
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
  listContainer: {
    paddingBottom: responsiveHeight(20)
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyListText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginVertical: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#85360B',
    gap: 16,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  shopImageWrapper: {
    width: 80,
    height: 80,
    borderRadius: 6.4,
    borderWidth: 0.5,
    borderColor: '#85360B',
    backgroundColor: '#FEF1E6',
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopImage: {
    width: 64,
    height: 64,
    borderRadius: 6.4,
  },
  orderMeta: {
    flex: 1,
    gap: 8,
  },
  orderIdLabel: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '400',
    lineHeight: 20,
  },
  orderIdValue: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '400',
    lineHeight: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 32,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  dateAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '400',
    lineHeight: 20,
  },
  metaValue: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '400',
    lineHeight: 20,
  },
  divider: {
    height: 0.5,
    backgroundColor: '#B0B0B0',
    alignSelf: 'stretch',
  },
  addressSection: {
    gap: 4,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addressIcon: {
    fontSize: 16,
  },
  addressTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#85360B',
    lineHeight: 20,
  },
  addressText: {
    fontSize: 12,
    color: '#545454',
    fontWeight: '400',
    lineHeight: 16,
  },
  moreItems: {
    color: '#C3A710',
    marginTop: 10,
    fontSize: 14,
    fontWeight: "600"
  },

  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginVertical: 4,
  },
  foodImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
    gap: 4,
    justifyContent: 'center'
  },
  foodName: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '600',
    width: '100%'
  },
  foodPrice: {
    fontSize: 16,
    color: '#065E2C',
    fontWeight: '700',
    marginTop: 2
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#065E2C',
    borderRadius: 6
  },
  quantityButton: {
    padding: 5
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 5,
    color: '#065E2C'
  },
  itemTotalPrice: {
    color: "#3D3D3D",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "right",
    marginTop: 3
  },
  dottedLineContainer: {
    flexDirection: 'row',
    marginTop: 8,
    alignSelf: 'center',
    marginBottom: 4,
  },
  dot: {
    width: 6,
    height: 1.5,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginHorizontal: 4,
  },
  viewDetailsButton: {
    backgroundColor: '#f8f9fa',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  viewDetailsButtonText: {
    color: '#065E2C',
    fontSize: 15,
    fontWeight: '600',
  },
  hideDetailsButton: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  hideDetailsButtonText: {
    color: '#065E2C',
    fontSize: 14,
    fontWeight: '600',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#065E2C",
  },
  counterText: {
    color: '#065E2C',
    fontSize: 16,
    fontWeight: '700',
    marginHorizontal: 10
  },
  addButton: {
    backgroundColor: '#fff',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#065E2C',
  },
  addButtonText: {
    color: '#065E2C',
    fontWeight: '700',
    fontSize: 14
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    overflow: 'hidden',
  },
});

export default ReorderScreen;
