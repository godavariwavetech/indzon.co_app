import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  Linking,
  BackHandler,
  RefreshControl,
  Alert,
  TextInput,
  SafeAreaView,
} from 'react-native';
import {
  responsiveHeight,
  responsiveWidth,
} from 'react-native-responsive-dimensions';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import HeaderPick2 from './tabassets/HeaderPick2';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
// import { getOrderDetails } from '../../redux/reducers/addressSlice';
import { useDispatch, useSelector } from 'react-redux';
import { getOrderDetails, getOrders } from '../../redux/reducers/daddy';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import CustomModal from '../../components/CustomModal';
import { cancelOrder, submitReview } from '../../redux/reducers/reviews';
import { getMessaging } from '@react-native-firebase/messaging';
import commonStyles from '../../commonstyles/CommonStyles';
import { colors } from '../../config/theme';
import StatusBarManager from '../../components/StatusBarManager';
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getChargesList } from '../../redux/reducers/addressSlice';

const OrderDetailsScreen = ({ navigation, route }) => {
  // const { orderDetails } = route.params;
  const dispatch = useDispatch();
  const [subOrderData, setSubOrderData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showReviewDetails, setShowReviewDetails] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false)
  const { chargesList, selectedAddress } = useSelector(
    state => state.address,
  );



  const insets = useSafeAreaInsets();

  const getOrderData = async () => {
    const response = await dispatch(
      getOrders({ orderId: route.params?.orderDetails?.id }),
    );
    if (response.payload?.data) {
      setOrderDetails(response.payload.data[0]);
    }
  };
  // console.log("order details", orderDetails)
  const fetchOrderItems = async () => {
    if (!orderDetails?.id) return;
    const response = await dispatch(
      getOrderDetails({ orderId: orderDetails.id }),
    );
    if (response.payload?.data) {
      setSubOrderData(response.payload.data);
    }
  };

  useEffect(() => {
    dispatch(getChargesList());
  }, []);

  useEffect(() => {
    getOrderData();
  }, [route.params?.orderDetails?.id]);

  useEffect(() => {
    if (
      orderDetails?.order_status === 3 &&
      orderDetails?.order_rating_status !== null
    ) {
      setShowReviewDetails(true);
      setRating(parseInt(orderDetails?.order_rating_status));
      setComment(orderDetails?.rating_comment || '');
    }
  }, [orderDetails]);

  useEffect(() => {
    fetchOrderItems();
  }, [orderDetails]);

  useEffect(() => {
    const backAction = () => {
      handleBackPress();
      return true;
    };

    const backHandler = route.params?.fromOrderSuccess
      ? BackHandler.addEventListener('hardwareBackPress', backAction)
      : null;

    return () => backHandler && backHandler.remove();
  }, [route.params]);

  // Add status mapping
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

  // Update orderData status
  const orderData = {
    restaurant: {
      name: orderDetails?.shop_name,
      orderTime: orderDetails?.order_time,
      image: orderDetails?.shop_image,
    },
    status: STATUS_MAP[orderDetails?.order_status] || 'Unknown Status',
    estimatedTime: orderDetails?.slot_timings, // Use slot timings for estimated delivery
    deliveryAgent: {
      name: orderDetails?.delivery_boy_array
        ? orderDetails?.delivery_boy_array[0]?.delivery_boy_name
        : 'N/A',
      status: 'On the way to pick order', // You can update this based on your logic
      phone: orderDetails?.delivery_boy_array
        ? orderDetails?.delivery_boy_array[0]?.delivery_boy_mobile_number
        : 'N/A',
    },
    delivery: {
      type: 'Home', // You can update this if needed
      address: orderDetails?.delivery_address, // Updated delivery address
      addressDetails: '', // You can update this if needed
      name: 'Rajesh', // You can update this if needed
      phone: orderDetails?.shop_phone_number, // Use shop phone number for contact
    },
    billing: {
      amount: orderDetails?.actual_total_amount, // Updated total amount
      savings: orderDetails?.total_saving_amount, // Updated savings
      couponDiscount: orderDetails?.coupon_amount, // Updated coupon discount
      couponCode: '', // You can update this if needed
      subtotal: orderDetails?.grand_total - orderDetails?.delivery_charges || 0, // Calculate subtotal if needed
      gst: 0, // You can update this if needed
      deliveryCharge: orderDetails?.delivery_charges, // Updated delivery charge
      handlingCharge: orderDetails?.handling_charges, // Updated handling charge
      total: orderDetails?.grand_total, // Updated grand total
    },
    tracking: {
      restaurant: {
        latitude: parseFloat(orderDetails?.shop_latitude), // Updated restaurant latitude
        longitude: parseFloat(orderDetails?.shop_longitude), // Updated restaurant longitude
      },
      delivery: {
        latitude: parseFloat(orderDetails?.order_latitude), // Updated delivery latitude
        longitude: parseFloat(orderDetails?.order_longitude), // Updated delivery longitude
      },
      current: {
        latitude: parseFloat(orderDetails?.order_latitude), // Use order latitude for current location
        longitude: parseFloat(orderDetails?.order_longitude), // Use order longitude for current location
      },
    },
  };

  // Safely parse delivery_boy_array
  try {
    // Log the delivery_boy_array to see its content

    // Check if the delivery_boy_array is a valid string
    let deliveryBoys = orderDetails?.delivery_boy_array;

    // Handle the case where delivery_boy_array is improperly formatted
    if (deliveryBoys === "'0'" || deliveryBoys === "'[]'" || !deliveryBoys) {
      deliveryBoys = '[]'; // Set to an empty array
    }

    // Parse the delivery_boy_array
    deliveryBoys =
      deliveryBoys && typeof deliveryBoys === 'string'
        ? JSON.parse(deliveryBoys.replace(/'/g, '"'))
        : [];

    if (Array.isArray(deliveryBoys) && deliveryBoys.length > 0) {
      orderData.deliveryAgent.name =
        deliveryBoys[0]?.delivery_boy_name || 'N/A';
      orderData.deliveryAgent.phone =
        deliveryBoys[0]?.delivery_boy_mobile_number || 'N/A';
    } else {
      orderData.deliveryAgent.name = 'N/A';
      orderData.deliveryAgent.phone = 'N/A';
    }
  } catch (error) {
    console.error('Error parsing delivery_boy_array:', error);
    // Keep default values for delivery agent
    orderData.deliveryAgent.name = 'N/A';
    orderData.deliveryAgent.phone = 'N/A';
  }

  const handleCallDriver = () => {
    Linking.openURL(`tel:${orderData?.deliveryAgent.phone}`);
  };

  const handleCallRestaurant = () => {

    Linking.openURL(`tel:${orderDetails?.shop_phone_number}`);
  };

  const handleBackPress = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'BottomNavigation' }],
    });
  };

  // useEffect(() => {
  //   const backAction = () => {
  //     handleBackPress();
  //     return true; // Prevent default back action
  //   };

  //   const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

  //   return () =>backHandler && backHandler.remove(); // Cleanup the event listener
  // }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await getOrderData();
    await fetchOrderItems();
    setRefreshing(false);
  };

  const handleCancelOrder = async () => {
    try {
      await dispatch(cancelOrder({ orderId: orderDetails.id }));
      // route.params?.fromOrderSuccess ? handleBackPress() : navigation.goBack();
      setShowCancelModal(false);
      setCancelSuccess(true)
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel order');
      setShowCancelModal(false);
    }
  };

  const handleCanceSuccess = () => {
    route.params?.fromOrderSuccess ? handleBackPress() : navigation.goBack();
    setCancelSuccess(false)
  }

  const handleSubmitReview = async () => {
    try {
      if (rating === 0) {
        setShowRatingModal(true);
        return;
      }
      await dispatch(
        submitReview({
          shopId: orderDetails?.shop_id,
          orderId: route.params?.orderDetails?.id,
          rating,
          comment,
        }),
      );
      setShowSuccessModal(true);
      await getOrderData();
      await fetchOrderItems();
    } catch (error) {
      Alert.alert('Error', 'Failed to submit review');
    }
  };

  useEffect(() => {
    getMessaging().onMessage(async remoteMessage => {
      onRefresh();
    });
  }, []);

  // Define allowed tracking statuses
  const TRACKING_STATUSES = [0, 1, 2, 8, 3];

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <StatusBarManager screenName="orderDetails" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() =>
              route.params?.fromOrderSuccess
                ? handleBackPress()
                : navigation.goBack()
            }>
            <FontAwesome6 name="arrow-left-long" size={20} color={"#fff"} />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Order Details</Text>
            {orderDetails?.order_id && (
              <Text style={styles.orderId}>
                Order ID: #{orderDetails.order_id} / {orderDetails?.id}
              </Text>
            )}
          </View>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: responsiveHeight(10) }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>

          {/* Restaurant Info */}
          <View style={styles.restaurantInfo}>
            <Image
              source={{ uri: orderData.restaurant.image }}
              style={styles.restaurantImage}
            />
            <View style={styles.restaurantDetails}>
              <Text style={styles.restaurantName}>
                {orderData.restaurant.name}
              </Text>
              <Text style={styles.orderTime}>
                Ordered At:- {orderDetails?.order_date}{' '}
                {orderData.restaurant.orderTime}
              </Text>
            </View>
            {/* <TouchableOpacity
              onPress={handleCallRestaurant}
              style={styles.callButton}>
              <MaterialIcons name="call" size={23} color='#fff' style={styles.callIcon} />
            </TouchableOpacity> */}
          </View>

          <View
            style={[
              styles.statusContainer,
              orderDetails?.order_status === 4 && styles.cancelledStatus,
              orderDetails?.order_status === 5 && styles.rejectedStatus,
            ]}
          >
            <View style={styles.statusHeader}>
              <Text style={styles.statusText}>{orderData.status}</Text>

              {/* Show Track Order button only if status is in tracking statuses */}
              {TRACKING_STATUSES.includes(orderDetails?.order_status) && (
                <TouchableOpacity
                  onPress={() => {
                    navigation.navigate('OrderTracking', { orderDetails });
                  }}
                  style={styles.callButton}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Text style={{ color: "#000", fontSize: 16, fontWeight: "600" }}>
                      Track Order
                    </Text>
                    <MaterialIcons
                      name="delivery-dining"
                      size={23}
                      color="#fff"
                      style={styles.callIcon}
                    />
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {orderDetails?.customer_otp && (
            <View style={styles.otpSection}>
              <Text style={styles.sectionTitle}>Delivery OTP</Text>
              <View style={styles.otpBox}>
                <Text style={styles.otpValue}>{orderDetails.customer_otp}</Text>
                <Text style={styles.otpHint}>Share this OTP with the delivery agent</Text>
              </View>
            </View>
          )}


          {/* Delivery Agent */}
          {(orderDetails?.order_status >= 8 || orderDetails?.order_status == 2) && (
            <View style={styles.agentContainer}>
              <View style={styles.agentHeader}>
                <Text style={styles.sectionTitle}>Delivery Agent</Text>
                <TouchableOpacity
                  onPress={handleCallDriver}
                  style={styles.callAgentButton}>
                  <MaterialIcons name="call" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
              <View style={styles.agentInfo}>
                <View style={styles.agentDetails}>
                  <Text style={styles.agentName}>
                    {orderData.deliveryAgent.name}
                  </Text>
                  <Text style={styles.agentStatus}>
                    {orderData.deliveryAgent.status}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Cart Items */}
          <View style={styles.cartSection}>
            <Text style={styles.sectionTitle}>Cart Items</Text>
            {subOrderData?.map(item => (
              <View key={item.id}>
                <View style={styles.cartItem}>
                  <View style={styles.itemDetails}>
                    <HeaderPick2 />
                    <Text style={styles.itemName}>{item.item_name}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                      <Text style={styles.itemPrice}>₹{item.item_price}</Text>
                      {item.actualitem_price !== item.item_price && (
                        <Text style={[styles.price, { textDecorationLine: 'line-through', color: '#888', fontSize: 14, marginTop: 4, }]}>₹{item.actualitem_price}</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.quantityInfo}>
                    <Text style={styles.quantity}>x{item.sub_item_count}</Text>
                    <Text style={styles.itemTotal}>
                      ₹{item.item_total_amount}
                    </Text>
                  </View>
                </View>
                <View style={styles.dottedLineContainer}>
                  {Array(20)
                    .fill(0)
                    .map((_, index) => (
                      <View key={index} style={styles.dot} />
                    ))}
                </View>
              </View>
            ))}
          </View>

          {/* Delivery Details */}
          <View style={styles.deliveryDetails}>
            <Text style={styles.sectionTitle}>Delivery Details</Text>
            <View style={styles.addressCard}>
              <View style={styles.addressSection}>
                <View style={styles.addressInfo}>
                  <Text style={styles.addressText}>
                    {orderData.delivery.address}
                    {'\n'}
                    {orderData.delivery.addressDetails}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Billing */}
          <View style={styles.billingSection}>
            <Text style={styles.sectionTitle}>Billing</Text>
            <View style={styles.billingCard}>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Amount</Text>
                <Text style={styles.billValue}>₹{orderData.billing.amount}</Text>
              </View>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Savings</Text>
                <Text style={styles.savingsValue}>
                  ₹{orderData.billing.savings}
                </Text>
              </View>
              {orderData.billing.couponDiscount > 0 &&
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Coupon Discount</Text>
                  <Text style={styles.savingsValue}>
                    ₹{orderData.billing.couponDiscount}
                  </Text>
                </View>}
              {orderData.billing.couponCode && <Text style={styles.couponCode}>
                "{orderData.billing.couponCode}"
              </Text>}
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Total</Text>
                <Text style={styles.savingsValue}>
                  ₹{orderData.billing.amount}
                </Text>
              </View>
              <View style={styles.dottedLineContainer}>
                {Array(20)
                  .fill(0)
                  .map((_, index) => (
                    <View key={index} style={styles.dot} />
                  ))}
              </View>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Delivery charges</Text>
                <Text style={styles.billValue}>
                  ₹{orderData.billing.deliveryCharge}
                </Text>
              </View>

              {orderData.billing.handlingCharge > 0 && (
                <>
                  <View>Handling charges</View>
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Handling charges</Text>
                    <Text style={styles.billValue}>
                      ₹{orderData.billing.handlingCharge}
                    </Text>
                  </View>
                </>
              )}

              <View style={styles.dottedLineContainer}>
                {Array(20)
                  .fill(0)
                  .map((_, index) => (
                    <View key={index} style={styles.dot} />
                  ))}
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>TOTAL</Text>
                <Text style={styles.totalValue}>₹{orderData.billing.total}</Text>
              </View>
            </View>
          </View>

          {/* Cancel button - only show for cancelable statuses */}
          {/* {(orderDetails?.order_status === 0) && (
            <View style={styles.actionButtonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCancelModal(true)}>
                <Text style={styles.cancelButtonText}>Cancel Order</Text>
              </TouchableOpacity>
            </View>
          )} */}

          {orderDetails?.order_status === 3 && (
            <View style={styles.reviewSection}>
              <Text style={styles.sectionTitle}>
                {showReviewDetails ? 'Your Review' : 'Rate Your Experience'}
              </Text>

              {showReviewDetails ? (
                <View style={styles.reviewContainer}>
                  <View style={styles.ratingStarsContainer}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <FontAwesome5
                        key={star}
                        name="star"
                        solid={star <= rating}
                        size={30}
                        color={star <= rating ? '#FFD700' : '#E0E0E0'}
                      />
                    ))}
                  </View>
                  {comment && (
                    <View style={styles.reviewCommentBox}>
                      <Text style={styles.reviewCommentText}>{comment}</Text>
                    </View>
                  )}
                </View>
              ) : (
                <>
                  <View style={styles.ratingContainer}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <TouchableOpacity
                        key={star}
                        onPress={() => setRating(star)}>
                        <FontAwesome5
                          name="star"
                          solid={star <= rating}
                          size={30}
                          color={star <= rating ? '#FFD700' : '#E0E0E0'}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Write your review..."
                    multiline
                    numberOfLines={4}
                    value={comment}
                    onChangeText={setComment}
                  />
                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmitReview}>
                    <Text style={styles.submitButtonText}>Submit Review</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </ScrollView>

        <CustomModal
          visible={showCancelModal}
          title="Confirm Cancellation"
          message="Are you sure you want to cancel this order?"
          confirmText="Yes, Cancel"
          cancelText="No, Keep Order"
          onConfirm={handleCancelOrder}
          onCancel={() => setShowCancelModal(false)}
        />

        <CustomModal
          visible={showSuccessModal}
          title="Thank You!"
          message="Your review has been submitted successfully."
          confirmText="OK"
          cancelText=""
          onConfirm={() => setShowSuccessModal(false)}
          showCancel={false}
        />

        <CustomModal
          visible={showRatingModal}
          title="Rating Required"
          message="Please select at least one star before submitting"
          confirmText="OK"
          cancelText=""
          onConfirm={() => setShowRatingModal(false)}
          showCancel={false}
        />

        <CustomModal
          visible={cancelSuccess}
          title="Order Cancelled"
          message="Your order has been cancelled successfully."
          confirmText="OK"
          cancelText=""
          onConfirm={handleCanceSuccess}
          showCancel={false}
        />
      </View>
      {/* WhatsApp Floating Button */}
      <TouchableOpacity
        style={[styles.whatsappButton, { bottom: (Platform.OS === 'ios' ? 20 : 20) + insets.bottom }]}
        onPress={() => {
          let phoneNumber = "+91" + chargesList[0].contact_number; // fallback number
          let message = `Hello, I have a query regarding my order #${orderDetails?.order_id}`;
          let url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
          Linking.openURL(url).catch(() => {
            Alert.alert("Make sure WhatsApp is installed on your device");
          });
        }}
      >
        <FontAwesome name="whatsapp" size={32} color="#fff" />
      </TouchableOpacity>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  whatsappButton: {
    position: "absolute",

    right: 20,
    backgroundColor: "#25D366",
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 5,
  },
  header: {
    backgroundColor: commonStyles.appMainColor,
    height: responsiveHeight(15),
    flexDirection: "row",
    alignItems: "flex-end",
    paddingBottom: responsiveHeight(3),
    paddingLeft: responsiveWidth(5)
  },
  backButton: {
    width: responsiveWidth(7)
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  orderId: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  mapContainer: {
    height: responsiveHeight(30),
    width: '100%',
  },
  map: {
    flex: 1,
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: responsiveWidth(5),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  restaurantImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
  },
  restaurantDetails: {
    flex: 1,
    marginLeft: responsiveWidth(3),
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  orderTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  callButton: {
    padding: responsiveWidth(1),
  },
  statusContainer: {
    padding: responsiveWidth(3),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    flex: 1,
  },
  estimatedTime: {
    alignItems: 'center',
  },
  estimatedTimeValue: {
    fontSize: 18,
    fontWeight: '700',
    color: commonStyles.appMainColor,
  },
  estimatedTimeLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  agentContainer: {
    padding: responsiveWidth(5),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  otpSection: {
    padding: responsiveWidth(5),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  otpBox: {
    marginTop: responsiveHeight(1),
    padding: responsiveWidth(2),
    borderWidth: 1,
    borderColor: commonStyles.appMainColor,
    borderRadius: 10,
    backgroundColor: '#F9F9F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpValue: {
    fontSize: 24,
    fontWeight: '700',
    color: commonStyles.appMainColor,
    letterSpacing: 5,
    marginBottom: 8,
  },
  otpHint: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },

  agentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: responsiveHeight(2),
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  callAgentButton: {
    backgroundColor: commonStyles.appMainColor,
    padding: responsiveWidth(2),
    borderRadius: 20,
  },
  agentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  agentDetails: {
    flex: 1,
  },
  agentName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  agentStatus: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  cartSection: {
    padding: responsiveWidth(5),
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: responsiveHeight(1),
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  itemPrice: {
    fontSize: 14,
    color: commonStyles.appMainColor,
    fontWeight: '600',
    marginTop: 4,
  },
  quantityInfo: {
    alignItems: 'flex-end',
  },
  quantity: {
    fontSize: 14,
    color: '#666',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginTop: 4,
  },
  deliveryDetails: {
    padding: responsiveWidth(5),
  },
  addressCard: {
    borderWidth: 1,
    borderColor: commonStyles.appMainColor,
    borderRadius: 8,
    padding: responsiveWidth(4),
    marginTop: responsiveHeight(1),
  },
  addressSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressInfo: {
    flex: 1,
    marginLeft: responsiveWidth(3),
  },
  addressType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    lineHeight: 20,
  },
  contactSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactInfo: {
    flex: 1,
    marginLeft: responsiveWidth(3),
  },
  contactName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  billingSection: {
    padding: responsiveWidth(5),
  },
  billingCard: {
    borderWidth: 1,
    borderColor: commonStyles.appMainColor,
    borderRadius: 8,
    padding: responsiveWidth(4),
    marginTop: responsiveHeight(1),
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: responsiveHeight(1),
  },
  billLabel: {
    fontSize: 14,
    color: '#525252',
  },
  billValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  savingsValue: {
    fontSize: 14,
    color: '#525252',
    fontWeight: '500',
  },
  gstValue: {
    fontSize: 14,
    color: '#FFCB18',
    fontWeight: '500',
  },
  couponCode: {
    fontSize: 12,
    color: commonStyles.appMainColor,
    marginLeft: responsiveWidth(2),
    marginBottom: responsiveHeight(1),
  },
  gstNote: {
    fontSize: 12,
    color: '#666',
    marginBottom: responsiveHeight(1),
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: responsiveHeight(1),
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  dottedLineContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: responsiveHeight(1),
    width: responsiveWidth(80),
    overflow: 'hidden',
    alignSelf: 'center',
  },
  dot: {
    width: 7,
    height: 2,
    backgroundColor: '#D8D8D8',
    borderRadius: 5,
    marginHorizontal: 5,
  },
  actionButtonContainer: {
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  cancelButton: {
    backgroundColor: '#E63B3B',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  reviewSection: {
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 15,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: commonStyles.appMainColor,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelledStatus: {
    backgroundColor: '#FFE5E5',
    borderColor: '#FF0000',
  },
  rejectedStatus: {
    backgroundColor: '#FFF3CD',
    borderColor: '#FFC107',
  },
  reviewCommentContainer: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  reviewCommentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  ratingStarsContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  reviewCommentBox: {
    padding: 15,
    borderRadius: 8,
    width: '100%',
    marginBottom: 15,
  },
  reviewCommentText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 20,
    fontWeight: '500',
  },
  reviewSubmittedText: {
    fontSize: 14,
    color: commonStyles.appMainColor,
    fontWeight: '600',
  },
  reviewContainer: {
    // alignItems: 'center',
    padding: 20,
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    marginVertical: 15,
  },
  callIcon: {
    backgroundColor: commonStyles.appMainColor,
    padding: 5,
    borderRadius: 30
  }
});

export default OrderDetailsScreen;
