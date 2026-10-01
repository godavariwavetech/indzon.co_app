import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  BackHandler,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import {
  responsiveHeight,
  responsiveWidth,
} from 'react-native-responsive-dimensions';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getMessaging } from '@react-native-firebase/messaging';
import { Linking } from 'react-native';

import { getOrderDetails, getOrders } from '../../redux/reducers/daddy';
import { getChargesList } from '../../redux/reducers/addressSlice';
import { cancelOrder, submitReview } from '../../redux/reducers/reviews';
import CustomModal from '../../components/CustomModal';
import StatusBarManager from '../../components/StatusBarManager';
import { colors } from '../../config/theme';
import commonStyles from '../../commonstyles/CommonStyles';

const OrderDetailsScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const [subOrderData, setSubOrderData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showReviewDetails, setShowReviewDetails] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(true);

  const { chargesList } = useSelector((state) => state.address);

  const getOrderData = async () => {
    const response = await dispatch(
      getOrders({ orderId: route.params?.orderDetails?.id }),
    );
    if (response.payload?.data) {
      setOrderDetails(response.payload.data[0]);
    }
  };

  const fetchOrderItems = async () => {
    if (!orderDetails?.id) return;
    const response = await dispatch(
      getOrderDetails({ orderId: orderDetails.id }),
    );
    console.log(response.payload, ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>RESPONSEEEEE PAYLOADDDD",orderDetails);
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
    if (orderDetails?.order_status === 3 && orderDetails?.order_rating_status !== null) {
      setShowReviewDetails(true);
      setRating(parseInt(orderDetails?.order_rating_status));
      setComment(orderDetails?.rating_comment || '');
    }
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

  useEffect(() => {
    const unsubscribe = getMessaging().onMessage(async () => {
      onRefresh();
    });
    return unsubscribe;
  }, []);

  const handleBackPress = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'BottomNavigation' }],
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await getOrderData();
    await fetchOrderItems();
    setRefreshing(false);
  };

  const handleCancelOrder = async () => {
    try {
      await dispatch(cancelOrder({ orderId: orderDetails.id }));
      setShowCancelModal(false);
      setCancelSuccess(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel order');
      setShowCancelModal(false);
    }
  };

  const handleCancelSuccess = () => {
    route.params?.fromOrderSuccess ? handleBackPress() : navigation.goBack();
    setCancelSuccess(false);
  };

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

  // Status mapping
  const STATUS_MAP = {
    0: { label: 'Order Placed', color: '#C3A710' },
    1: { label: 'Order Accepted', color: '#C3A710' },
    2: { label: 'Order On The Way', color: '#1976D2' },
    3: { label: 'Delivered', color: '#689F38' },
    4: { label: 'Cancelled by You', color: '#E53935' },
    5: { label: 'Rejected', color: '#E53935' },
    6: { label: 'Not Received', color: '#E53935' },
    7: { label: 'Waiting for Payment', color: '#C3A710' },
    8: { label: 'Partner Assigned', color: '#1976D2' },
  };

  const currentStatusInfo = STATUS_MAP[orderDetails?.order_status] || { label: 'Unknown', color: '#757575' };

  // Determine Timeline Progress
  const getTimelineSteps = () => {
    const status = orderDetails?.order_status;
    const isCancelled = [4, 5, 6].includes(status);

    let activeIndex = 0;
    if (status === 1) activeIndex = 1;
    if (status === 2 || status === 8) activeIndex = 3;
    if (status === 3) activeIndex = 4;

    return [
      {
        title: 'Order Placed',
        time: orderDetails?.order_date_time || orderDetails?.order_date,
        isActive: activeIndex >= 0,
        icon: 'clipboard-list',
        isCancelled: false
      },
      {
        title: 'Order Confirmed',
        desc: `Your order has been confirmed, ${orderDetails?.accept_order_date_time || ''}`,
        time: orderDetails?.accept_order_date_time,
        isActive: activeIndex >= 1 && !isCancelled,
        icon: 'check-circle',
        isCancelled: isCancelled && activeIndex < 1
      },
      {
        title: 'Packed',
        desc: `Order is packed and ready for dispatch, ${orderDetails?.delivery_accepted_date_time || ''}`,
        time: orderDetails?.delivery_accepted_date_time,
        isActive: activeIndex >= 2 && !isCancelled,
        icon: 'box',
        isCancelled: isCancelled && activeIndex < 2
      },
      {
        title: 'Out For Delivery',
        desc: 'Order is out for delivery',
        time: orderDetails?.deliveryboy_pickup_time,
        isActive: activeIndex >= 3 && !isCancelled,
        icon: 'motorcycle',
        isCancelled: isCancelled && activeIndex < 3
      },
      {
        title: 'Delivered',
        desc: `Delivered on, ${orderDetails?.order_deliverd_date_time || ''}`,
        time: orderDetails?.order_deliverd_date_time,
        isActive: activeIndex >= 4,
        icon: 'check-circle',
        isCancelled: false
      }
    ];
  };

  const timelineSteps = getTimelineSteps();

  return (
    <View style={styles.container}>
      <StatusBarManager screenName="orderDetails" />

      {/* Gradient Header */}
      <LinearGradient
        colors={['#DF4F00', '#D14A00', '#6C2600']}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (route.params?.fromOrderSuccess ? handleBackPress() : navigation.goBack())}
        >
          <FontAwesome6 name="arrow-left-long" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Orders</Text>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Card 1: Order ID + Status + Date + Total */}
        <View style={styles.card}>
          <View style={styles.orderIdRow}>
            <View style={styles.idContainer}>
              <Text style={styles.metaLabel}>Order ID:</Text>
              <Text style={styles.orderIdValue}>#{orderDetails?.order_id}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: currentStatusInfo.color }]}>
              {orderDetails?.order_status === 3 && (
                <MaterialIcons name="check-circle" size={14} color="#fff" style={{ marginRight: 4 }} />
              )}
              <Text style={styles.statusBadgeText}>{currentStatusInfo.label}</Text>
            </View>
          </View>

          <View style={styles.dateAmountRow}>
            <View>
              <Text style={styles.metaLabel}>Date & Time:</Text>
              <Text style={styles.metaValue}>{orderDetails?.order_date}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.metaLabel}>Total Amount:</Text>
              <Text style={styles.metaValue}>₹{orderDetails?.grand_total}/-</Text>
            </View>
          </View>
        </View>

        {/* Card 2: Cart Items + RE-ORDER */}
        <View style={[styles.card, styles.borderedCard]}>
          {subOrderData?.map((item, idx) => (
            <View key={item.id || idx} style={styles.cartItemRow}>
              {/* Image Box */}
              <View style={styles.itemImageContainer}>
                <Image
                  source={{ uri: item.item_image || 'https://via.placeholder.com/150' }}
                  style={styles.itemImage}
                />
              </View>

              {/* Item Details */}
              <View style={styles.itemInfoCol}>
                <View style={styles.vegTitleRow}>
                  <View style={[styles.vegBadge, item.food_type === 'Non Veg' ? styles.nonVeg : styles.veg]}>
                    <View style={[styles.vegDot, item.food_type === 'Non Veg' ? styles.nonVegDot : styles.vegDotInner]} />
                  </View>
                  <Text style={styles.itemName} numberOfLines={1}>{item.item_name}</Text>
                </View>

                {item.item_description && (
                  <Text style={styles.customizedLabel}>Customized with</Text>
                )}
                {item.item_description && (
                  <Text style={styles.customizedValue}>{item.item_description}</Text>
                )}
              </View>

              {/* Price Details */}
              <View style={styles.itemPriceCol}>
                <Text style={styles.itemPriceValue}>₹{item.item_total_amount || item.item_price}</Text>
                {item.actualitem_price && item.actualitem_price !== item.item_price && (
                  <Text style={styles.itemPriceStrike}>₹{item.actualitem_price}</Text>
                )}
              </View>
            </View>
          ))}

          {/* RE-ORDER button */}
          {/* <TouchableOpacity
            style={styles.reorderButton}
            onPress={() =>
              navigation.navigate('RestaurantScreen', {
                shopId: orderDetails?.shop_id,
                shopItem: null,
                item: orderDetails,
              })
            }
          >
            <Text style={styles.reorderButtonText}>RE-ORDER</Text>
          </TouchableOpacity> */}
        </View>

        {/* Card 3: Rate This Order */}
        {orderDetails?.order_status === 3 && (
          <View style={styles.rateCard}>
            <View style={styles.rateContentBox}>
              <View style={styles.rateLeftCol}>
                <Text style={styles.rateTitle}>
                  {showReviewDetails ? 'Your Review' : 'Rate This Order'}
                </Text>

                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      disabled={showReviewDetails}
                      onPress={() => setRating(star)}
                    >
                      <FontAwesome5
                        name="star"
                        solid={star <= rating}
                        size={24}
                        color={star <= rating ? '#FFBB00' : '#E0E0E0'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.rateSubtitle}>
                  {rating > 3 ? "Excellent !" : rating > 0 ? "Good" : ""}
                </Text>
              </View>

              {/* Placeholder for 3D Kid Image */}
              <View style={styles.rateRightCol}>
                <Ionicons name="fast-food-outline" size={60} color="#FFBB00" style={{ opacity: 0.5 }} />
              </View>
            </View>

            {!showReviewDetails && (
              <View style={{ marginTop: 10 }}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Write your review..."
                  multiline
                  value={comment}
                  onChangeText={setComment}
                />
                <TouchableOpacity style={styles.submitReviewBtn} onPress={handleSubmitReview}>
                  <Text style={styles.reorderButtonText}>Submit Review</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Card 4: Addresses */}
        <View style={styles.card}>
          {/* Delivery Address */}
          <View style={styles.addressSection}>
            <View style={styles.addressHeader}>
              <FontAwesome5 name="map-marker-alt" size={16} color="#85360B" />
              <Text style={styles.addressTitle}>Delivery Address</Text>
            </View>
            <Text style={styles.addressBody}>{orderDetails?.delivery_address}</Text>
          </View>

          <View style={styles.addressDivider} />

          {/* Restaurant Address */}
          <View style={styles.addressSection}>
            <View style={styles.addressHeader}>
              <FontAwesome5 name="store" size={14} color="#85360B" />
              <Text style={styles.addressTitle}>Restaurant Address</Text>
            </View>
            <Text style={styles.addressBody}>{orderDetails?.shop_address || orderDetails?.shop_name}</Text>
          </View>
        </View>

        {/* Card 5: Order Status Vertical Timeline */}
        <View style={styles.card}>
          <View style={styles.summaryHeaderRow}>
            <Text style={styles.sectionTitle}>Order Status</Text>
          </View>

          <View style={styles.timelineContainer}>
            {timelineSteps.map((step, index) => {
              const isLast = index === timelineSteps.length - 1;
              const iconColor = step.isActive ? '#85360B' : '#B0B0B0';
              const textColor = step.isActive ? '#343434' : '#B0B0B0';

              return (
                <View key={index} style={styles.timelineStepRow}>
                  {/* Left Icon & Line */}
                  <View style={styles.timelineIconCol}>
                    <View style={[styles.timelineIconCircle, { borderColor: iconColor }]}>
                      <FontAwesome5 name={step.icon} size={8} color={iconColor} />
                    </View>
                    {!isLast && (
                      <View style={[
                        styles.timelineDashedLine,
                        { borderColor: step.isActive ? '#757575' : '#E0E0E0' }
                      ]} />
                    )}
                  </View>

                  {/* Right Text Content */}
                  <View style={styles.timelineTextCol}>
                    <Text style={[styles.timelineStepTitle, { color: textColor }]}>
                      {step.title}
                    </Text>
                    {step.desc && step.isActive ? (
                      <Text style={styles.timelineStepDesc}>{step.desc}</Text>
                    ) : step.time && step.isActive ? (
                      <Text style={styles.timelineStepTime}>{step.time}</Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Card 6: Order Summary */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.summaryHeaderRow}
            onPress={() => setSummaryExpanded((p) => !p)}
            activeOpacity={0.8}
          >
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <View style={styles.viewLessBox}>
              <Text style={styles.viewLessText}>{summaryExpanded ? 'View Less' : 'View More'}</Text>
              <MaterialIcons
                name={summaryExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                size={18}
                color="#545454"
              />
            </View>
          </TouchableOpacity>

          {summaryExpanded && (
            <View style={styles.summaryBody}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal ({orderDetails?.item_count || 1} items):</Text>
                <Text style={styles.summaryValueBold}>₹{orderDetails?.grand_total || '0'}</Text>
              </View>

              {Number(orderDetails?.total_saving_amount) > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Product Discounts:</Text>
                  <Text style={styles.summaryDiscountValue}>- ₹{orderDetails?.total_saving_amount}</Text>
                </View>
              )}

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery Charges:</Text>
                <Text style={styles.summaryValueBold}>
                  {Number(orderDetails?.delivery_charges) === 0
                    ? '₹0.00 (Free Delivery)'
                    : `₹${orderDetails?.delivery_charges}`}
                </Text>
              </View>

           {orderDetails?.handling_charges &&   <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Taxes & Charges:</Text>
                {<Text style={styles.summaryValueBold}>
                  {Number(orderDetails?.handling_charges) === 0
                    ? '₹0.00 (Included)'
                    : `₹${orderDetails?.handling_charges}`}
                </Text>}
              </View>}

              <View style={styles.summaryTotalRow}>
                <Text style={styles.summaryTotalLabel}>Total Payable:</Text>
                <Text style={styles.summaryTotalValue}>₹{orderDetails?.grand_total}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Spacer for bottom */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* WhatsApp Floating Button */}
      {/* <TouchableOpacity
        style={[styles.whatsappButton, { bottom: 20 + insets.bottom }]}
        onPress={() => {
          const phoneNumber = '+91' + (chargesList?.[0]?.contact_number || '');
          const message = `Hello, I have a query regarding my order #${orderDetails?.order_id}`;
          const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
          Linking.openURL(url).catch(() => Alert.alert('Make sure WhatsApp is installed'));
        }}
      >
        <FontAwesome name="whatsapp" size={32} color="#fff" />
      </TouchableOpacity> */}

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
        onConfirm={handleCancelSuccess}
        showCancel={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
  },
  header: {
    minHeight: 100,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    justifyContent: 'center',
    width: '100%',
    flexShrink: 0,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    bottom: 24,
    padding: 8,
    zIndex: 10,
  },
  headerTitle: {
    fontFamily: 'SF Pro Display',
    fontWeight: '700',
    fontSize: 20,
    color: '#fff',
    marginTop: 20,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  borderedCard: {
    borderWidth: 0.5,
    borderColor: '#85360B',
  },
  rateCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  /* --- Card 1: ID & Status --- */
  orderIdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  idContainer: {
    flex: 1,
  },
  metaLabel: {
    fontFamily: 'SF Pro Display',
    fontSize: 12,
    color: '#757575',
    marginBottom: 2,
  },
  orderIdValue: {
    fontFamily: 'SF Pro Display',
    fontSize: 14,
    color: '#343434',
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 32,
  },
  statusBadgeText: {
    fontFamily: 'SF Pro Display',
    fontWeight: '700',
    fontSize: 12,
    color: '#fff',
  },
  dateAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaValue: {
    fontFamily: 'SF Pro Display',
    fontSize: 14,
    color: '#343434',
    fontWeight: '500',
  },
  /* --- Card 2: Items --- */
  cartItemRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  itemImageContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#FEF1E6',
    borderWidth: 0.6,
    borderColor: '#85360B',
    borderRadius: 4.8,
    padding: 6,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: 4.8,
  },
  itemInfoCol: {
    flex: 1,
    paddingRight: 8,
  },
  vegTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  vegBadge: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderRadius: 2.4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  veg: { borderColor: '#05AC0B' },
  nonVeg: { borderColor: '#EC0000' },
  vegDot: { width: 6, height: 6, borderRadius: 3 },
  vegDotInner: { backgroundColor: '#05AC0B' },
  nonVegDot: { backgroundColor: '#EC0000' },
  itemName: {
    fontFamily: 'SF Pro Display',
    fontWeight: '700',
    fontSize: 14,
    color: '#313131',
    flexShrink: 1,
  },
  customizedLabel: {
    fontFamily: 'SF Pro Display',
    fontSize: 12,
    color: '#757575',
    marginBottom: 2,
  },
  customizedValue: {
    fontFamily: 'SF Pro Display',
    fontSize: 12,
    color: '#404040',
  },
  itemPriceCol: {
    alignItems: 'center',
  },
  itemPriceValue: {
    fontFamily: 'SF Pro Display',
    fontWeight: '700',
    fontSize: 16,
    color: '#85360B',
  },
  itemPriceStrike: {
    fontFamily: 'SF Pro Display',
    fontSize: 12,
    color: '#919191',
    textDecorationLine: 'line-through',
    marginTop: 4,
  },
  reorderButton: {
    backgroundColor: '#85360B',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  reorderButtonText: {
    fontFamily: 'SF Pro Display',
    fontWeight: '700',
    fontSize: 16,
    color: '#fff',
  },
  /* --- Card 3: Rate Order --- */
  rateContentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rateLeftCol: {
    flex: 1,
    alignItems: 'center',
  },
  rateRightCol: {
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateTitle: {
    fontFamily: 'SF Pro Display',
    fontWeight: '700',
    fontSize: 14,
    color: '#000',
    marginBottom: 12,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  rateSubtitle: {
    fontFamily: 'SF Pro Display',
    fontSize: 14,
    color: '#000',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    minHeight: 60,
    fontFamily: 'SF Pro Display',
    fontSize: 14,
    marginBottom: 10,
    backgroundColor: '#F9F9F9',
  },
  submitReviewBtn: {
    backgroundColor: '#85360B',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  /* --- Card 4: Addresses --- */
  addressSection: {
    marginBottom: 12,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  addressTitle: {
    fontFamily: 'SF Pro Display',
    fontWeight: '700',
    fontSize: 14,
    color: '#85360B',
    marginLeft: 6,
  },
  addressBody: {
    fontFamily: 'SF Pro Display',
    fontSize: 12,
    lineHeight: 20,
    color: '#545454',
  },
  addressDivider: {
    height: 1,
    backgroundColor: '#B0B0B0',
    marginVertical: 12,
  },
  /* --- Card 5: Timeline --- */
  sectionTitle: {
    fontFamily: 'SF Pro Display',
    fontWeight: '700',
    fontSize: 14,
    color: '#000',
  },
  timelineContainer: {
    marginTop: 16,
    paddingLeft: 8,
  },
  timelineStepRow: {
    flexDirection: 'row',
    minHeight: 50,
  },
  timelineIconCol: {
    width: 30,
    alignItems: 'center',
  },
  timelineIconCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    zIndex: 2,
  },
  timelineDashedLine: {
    flex: 1,
    width: 1,
    borderStyle: 'dashed',
    borderLeftWidth: 1.5,
    marginTop: -2,
    marginBottom: -2,
    zIndex: 1,
  },
  timelineTextCol: {
    flex: 1,
    paddingBottom: 24,
    paddingLeft: 4,
    marginTop: -2,
  },
  timelineStepTitle: {
    fontFamily: 'SF Pro Display',
    fontWeight: '500',
    fontSize: 13,
    marginBottom: 2,
  },
  timelineStepDesc: {
    fontFamily: 'SF Pro Display',
    fontSize: 12,
    color: '#343434',
    lineHeight: 16,
  },
  timelineStepTime: {
    fontFamily: 'SF Pro Display',
    fontSize: 12,
    color: '#757575',
  },
  /* --- Card 6: Order Summary --- */
  summaryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewLessBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewLessText: {
    fontFamily: 'SF Pro Display',
    fontSize: 12,
    color: '#545454',
    marginRight: 4,
  },
  summaryBody: {
    marginTop: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontFamily: 'SF Pro Display',
    fontSize: 14,
    color: '#343434',
  },
  summaryValueBold: {
    fontFamily: 'SF Pro Display',
    fontWeight: '700',
    fontSize: 14,
    color: '#343434',
  },
  summaryDiscountValue: {
    fontFamily: 'SF Pro Display',
    fontWeight: '700',
    fontSize: 14,
    color: '#05AC0B',
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#B0B0B0',
    paddingTop: 12,
    marginTop: 4,
  },
  summaryTotalLabel: {
    fontFamily: 'SF Pro Display',
    fontWeight: '700',
    fontSize: 16,
    color: '#343434',
  },
  summaryTotalValue: {
    fontFamily: 'SF Pro Display',
    fontWeight: '700',
    fontSize: 16,
    color: '#343434',
  },
  whatsappButton: {
    position: 'absolute',
    right: 20,
    backgroundColor: '#25D366',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 5,
  },
});

export default OrderDetailsScreen;
