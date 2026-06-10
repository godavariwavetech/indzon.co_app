import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  StatusBar,
  Modal,
  ActivityIndicator,
  SafeAreaView,
  Alert
} from 'react-native';
import {
  responsiveHeight,
  responsiveWidth,
} from 'react-native-responsive-dimensions';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import HeaderPick2 from './tabassets/HeaderPick2';
import { useDispatch, useSelector } from 'react-redux';
import {
  addToCart,
  removeFromCart,
  // removeCoupon,
  placeOrder,
  generateOrderId,
  updateOrderStatus,
  clearCart,
} from '../../redux/reducers/daddy';
import Entypo from 'react-native-vector-icons/Entypo';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getChargesList } from '../../redux/reducers/addressSlice';
import { haversineDistance } from './distanceCalculator';
import { removeCoupon } from '../../redux/reducers/coupons';
import RestaurantScreen from './RestaurantScreen';
import commonStyles from '../../commonstyles/CommonStyles';
import StatusBarManager from '../../components/StatusBarManager';
import RazorpayCheckout from 'react-native-razorpay';


const CheckoutScreen = ({ navigation, route }) => {
  const { cartItems, totalPrice } = useSelector(state => state.Dashboard);
  const { appliedCoupon } = useSelector(state => state.coupons);
  const { chargesList, selectedAddress } = useSelector(
    state => state.address,
  );
  const {
    customerId,
    reaturantDetails,
    orderOfferAmount,
    locationId,
    locationName,
  } = useSelector(state => state.Auth);
  const dispatch = useDispatch();

  console.log("reaturantDetails", reaturantDetails)

  const handlingCharges = chargesList?.[0]?.handling_charges || 0;

  // Debug logging
  // console.log("Debug - chargesList:", chargesList);
  // console.log("Debug - handlingCharges:", handlingCharges);
  // console.log("Debug - cartItems length:", cartItems.length);
  const [clearCartConfirmVisible, setClearCartConfirmVisible] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [totalSellingPrice, setTotalSellingPrice] = useState(0);
  const [totalSellingPriceOriginal, setTotalSellingPriceOriginal] = useState(0);
  const [totalExtraPrice, setTotalExtraPrice] = useState(0);
  const [itemsTotalPrice, setItemsTotalPrice] = useState(0);
  const [totalSavings, setTotalSavings] = useState(0);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [distance, setDistance] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [delivery, setDelivery] = useState({
    baseCharge: 0,
    gstAmount: 0,
    totalCharge: 0,
  });
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);


  const addItem = item => {
    dispatch(addToCart(item));
  };

  const decreaseItem = item => {
    dispatch(removeFromCart(item));
  };

  useEffect(() => {
    if (cartItems.length === 0) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'BottomNavigation' }],
      });
    }
  }, [cartItems.length]);


  const caliculateTotalPrice = useCallback(() => {
    const totals = cartItems.reduce(
      (acc, item, index) => {
        const actualTotal = parseFloat(item.actual_price) * item.quantity;
        const sellingTotal = parseFloat(item.selling_price) * item.quantity;
        const sellingOriginal = parseFloat(item.sellingprice || 0) * item.quantity;
        const extraPriceTotal = parseFloat(item.extra_price || 0) * item.quantity;

        acc.totalSellingPrice += sellingTotal;
        acc.totalActualPrice += actualTotal;
        acc.totalSavings += actualTotal - sellingTotal;
        acc.totalSellingPriceOriginal += sellingOriginal;
        acc.totalExtraPrice += extraPriceTotal;
        return acc;
      },
      {
        totalSellingPrice: 0,
        totalActualPrice: 0,
        totalSavings: 0,
        totalSellingPriceOriginal: 0,
        totalExtraPrice: 0
      },
    );

    setTotalSellingPrice(totals.totalSellingPrice);
    setTotalSavings(totals.totalSavings);
    setTotalSellingPriceOriginal(totals.totalSellingPriceOriginal);
    setTotalExtraPrice(totals.totalExtraPrice);

    // Coupon Handling
    if (appliedCoupon) {
      const totalSellingPriceNum = parseFloat(totals.totalSellingPrice);
      const couponMinOrderValue = parseFloat(appliedCoupon.coupon_upto_price);
      const couponMaxDiscountLimit = parseFloat(appliedCoupon.coupon_max_price_limit);
      if (totalSellingPriceNum < couponMinOrderValue) {
        dispatch(removeCoupon());
        setCouponDiscount(0);
        setItemsTotalPrice(totalSellingPriceNum);
        return;
      }
      let discountAmount = (totalSellingPriceNum * appliedCoupon.coupon_percentage) / 100;
      discountAmount = Math.min(discountAmount, couponMaxDiscountLimit);
      setCouponDiscount(discountAmount);
      setItemsTotalPrice(totalSellingPriceNum - discountAmount);
    } else {
      setItemsTotalPrice(totals.totalSellingPrice);
    }
  }, [cartItems, appliedCoupon, dispatch]);

  const renderCartItem = ({ item }) => {
    const eachPrice = Number(item.selling_price) * Number(item.quantity);
    return (
      <View>
        <View style={styles.cartItem}>
          <Image source={{ uri: item.item_image }} style={styles.foodImage} />
          <View style={styles.itemDetails}>
            <HeaderPick2 />
            <Text style={styles.foodName}>{item.item_name}</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.actualPrice}>₹{item.actual_price}</Text>
              <Text style={styles.sellingPrice}>₹{item.selling_price}</Text>
            </View>
          </View>
          <View>
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                onPress={() => decreaseItem(item)}
                style={styles.quantityButton}>
                <AntDesign name="minus" size={16} color={commonStyles.appMainColor} />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{item.quantity}</Text>
              <TouchableOpacity
                onPress={() => addItem(item)}
                style={styles.quantityButton}>
                <AntDesign name="plus" size={16} color={commonStyles.appMainColor} />
              </TouchableOpacity>
            </View>
            <Text style={styles.itemTotalPrice}>₹ {eachPrice}</Text>
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
    );
  };

  const calculateDeliveryCharge = useCallback((
    distance,
    cartPrice,
    minOrderPrice,
    gstRate = 18,
  ) => {
    let deliveryCharge = reaturantDetails?.minimum_del_charge || 0;

    if (distance >= Number(reaturantDetails?.minimum_km || 3)) {
      deliveryCharge = deliveryCharge + (Number(distance) - Number(reaturantDetails?.minimum_km)) * (reaturantDetails?.per_km_chargers || 10);
    }

    if (cartPrice < minOrderPrice) {
      deliveryCharge += 10;
    }

    let gstAmount = 0;
    let totalDeliveryCharge = deliveryCharge + gstAmount;

    return {
      baseCharge: deliveryCharge,
      gstAmount: gstAmount,
      totalCharge: totalDeliveryCharge.toFixed(2),
    };
  }, [reaturantDetails]);

  const handlePlaceOrder = async () => {
    if (!selectedPaymentMethod) {
      Alert.alert('Select Payment', 'Please choose a payment method to continue.');
      return;
    }
    try {
      setIsProcessingPayment(true);

      console.log("ammo", cartItems)

      // 🔹 Common payload (Cash On Delivery or Razorpay)
      let payload = {
        order_status: 0,
        actual_total_amount: itemsTotalPrice,
        customer_id: customerId,
        customer_name: selectedAddress?.customer_name,
        customer_mobile_number: selectedAddress?.customer_mobile_number,
        category_id: cartItems[0]?.category_id,
        sub_category_id: cartItems[0]?.sub_category_id,
        admin_percentage: Number(reaturantDetails?.admin_percentage || 0),
        item_count: cartItems?.reduce((sum, item) => sum + Number(item.quantity), 0),
        total_amount: totalSellingPriceOriginal,
        total_sub_amount: totalSellingPrice,
        extraprice_amount: totalExtraPrice,
        total_saving_amount: totalSavings,
        coupon_amount: couponDiscount,
        delivery_charges: delivery.totalCharge,
        grand_total: grandTotal,
        location_id: locationId,
        location_name: locationName,
        payment_type: selectedPaymentMethod,
        payment_id: null,
        razorpay_order_id: null,
        order_instructions: 'test order',
        coupon_type: appliedCoupon?.coupon_type || "0",
        coupon_id: appliedCoupon?.id || "0",
        delivery_address: selectedAddress
          ? selectedAddress.full_address
          : 'No address selected',
        order_latitude: selectedAddress?.customer_latitude || '0',
        order_longitude: selectedAddress?.customer_longitude || '0',
        // slot_timings: 'Fast Delivery',
        order_distance: distance,
        ext_del_charge: '0',
        shop_id: cartItems[0]?.shop_id,
        user_player_id: null,
        order_type: 0,
        delivery_charges_gst: delivery.gstAmount,
        handling_charges: chargesList[0].handling_charges,
        packing_charges: 0,
        packing_charges_gst: 0,
        donation_charges: chargesList[0].donation_charges,
        sub_order_array: cartItems.map(item => ({
          item_name: item.item_name,
          item_image: item.item_image,
          item_id: item.id,
          category_id: item.category_id,
          sub_category_id: item.sub_category_id,
          category_name: item.category_name,
          sellingprice: item.sellingprice || 0,
          extra_price: item.extra_price || 0,
          sub_category_name: item.sub_category_name,
          actualitem_price: item.actual_price,
          item_price: item.selling_price,
          sub_item_count: item.quantity,
          item_total_amount: item.selling_price * item.quantity,
          filter_name: item.filter_one,
          item_description: item.item_description,
          saving_price: item.discount_amount,
          shop_id: item.shop_id,
          filter_one: item.filter_one,
        })),
      };

      console.log("order payload chargesssssssssssssssssssssssssss", payload)

      // 🔹 Case 1: Cash On Delivery
      if (selectedPaymentMethod === 'Cash On Delivery') {
        const responseCod = await dispatch(placeOrder({ orderDetails: payload }));

        console.log(responseCod,">>>>>>>>>>>>>>>RESPONSEEE COD");

        if (!responseCod?.payload) {
          Alert.alert("Order Failed", "Unable to place COD order. Please try again.");
          return;
        }

        navigation.replace('OrderSuccess', { response: responseCod.payload });
        return;
      }

      // 🔹 Case 2: Razorpay Flow
      if (selectedPaymentMethod === 'Pay Online') {
        // Step 1: Generate Razorpay Order ID
        const razorpayOrderResponse = await dispatch(generateOrderId({ orderAmount: grandTotal }));
        const razorpayOrder = razorpayOrderResponse?.payload;


        console.log(razorpayOrder,">>>>>>>>>>>>>>>>>>>>>>>>>>>>razorpayOrder");

        if (!razorpayOrder?.id) {
          Alert.alert("Payment Error", "Failed to generate Razorpay Order ID. Please try again.");
          return;
        }

        // Step 2: Create Pending Order in DB
        const pendingOrder = await dispatch(placeOrder({
          orderDetails: {
            ...payload,
            order_status: 7, // Pending
            razorpay_order_id: razorpayOrder.id,
          }
        }));

        if (!pendingOrder?.payload?.order_id) {
          Alert.alert("Order Error", "Failed to create pending order. Please try again.");
          return;
        }

        // Step 3: Open Razorpay Checkout
        const options = {
          description: 'Order Payment',
          currency: razorpayOrder.currency || 'INR',
          key: razorpayOrder.key_id,
          amount: razorpayOrder.amount,
          order_id: razorpayOrder.id,
          name: 'Amaraa',
          prefill: {
            email: selectedAddress?.customer_email || 'test@example.com',
            contact: selectedAddress?.customer_mobile_number,
            name: selectedAddress?.customer_name,
          },
          theme: { color: '#3399cc' },
        };

        try {
          const razorpayResult = await RazorpayCheckout.open(options);
          // { razorpay_payment_id, razorpay_order_id, razorpay_signature }

          const verifyRes = await dispatch(updateOrderStatus({
            paymentId: razorpayResult?.razorpay_payment_id,
            rzpId: razorpayResult?.razorpay_order_id,
            orderId: pendingOrder.payload.id,
            customer_id: customerId
          }));

          if (!verifyRes?.payload) {
            Alert.alert("Payment Verification Failed", "Your payment was captured, but verification failed. Contact support.");
            return;
          }

          navigation.replace('OrderSuccess', { response: pendingOrder.payload });

        } catch (error) {


          // Mark order as failed (optional)
          await dispatch(updateOrderStatus({
            orderId: pendingOrder.payload.order_id,
            status: "failed"
          }));

          Alert.alert("Payment Cancelled", "Transaction was not completed.");
        }
      }

    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Unexpected Error', error?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const navigateToCoupons = () => {
    navigation.navigate('Coupons', {
      onCouponSelect: coupon => {
        // Handle the coupon selection here
      },
    });
  };

  useEffect(() => {
    dispatch(getChargesList());
  }, []);

  // Recalculate grand total when chargesList is loaded
  // Memoize distance calculation
  const calculatedDistance = useMemo(() => {
    if (!selectedAddress || !reaturantDetails) return 0;
    return haversineDistance(
      selectedAddress.customer_latitude,
      selectedAddress.customer_longitude,
      reaturantDetails.shop_latitude,
      reaturantDetails.shop_longitude,
    );
  }, [selectedAddress, reaturantDetails]);

  // Memoize delivery charges calculation
  const deliveryCharges = useMemo(() => {
    if (!reaturantDetails || !chargesList?.length) return { baseCharge: 0, gstAmount: 0, totalCharge: 0 };
    return calculateDeliveryCharge(
      calculatedDistance,
      itemsTotalPrice,
      orderOfferAmount,
    );
  }, [calculatedDistance, itemsTotalPrice, orderOfferAmount, calculateDeliveryCharge, reaturantDetails, chargesList]);

  // Memoize grand total calculation
  const calculatedGrandTotal = useMemo(() => {
    return totalSellingPrice
      - couponDiscount
      + Number(deliveryCharges.totalCharge)
      + Number(handlingCharges || 0);
  }, [totalSellingPrice, couponDiscount, deliveryCharges.totalCharge, handlingCharges]);

  // Update states when calculated values change
  useEffect(() => {
    setDistance(calculatedDistance);
  }, [calculatedDistance]);

  useEffect(() => {
    setDelivery(deliveryCharges);
  }, [deliveryCharges]);

  useEffect(() => {
    setGrandTotal(calculatedGrandTotal);
    // console.log("Debug - Grand Total Calculation:");
    // console.log("  totalSellingPrice:", totalSellingPrice);
    // console.log("  couponDiscount:", couponDiscount);
    // console.log("  deliveryCharges.totalCharge:", deliveryCharges.totalCharge);
    // console.log("  handlingCharges:", handlingCharges);
    // console.log("  calculatedGrandTotal:", calculatedGrandTotal);
  }, [calculatedGrandTotal, totalSellingPrice, couponDiscount, deliveryCharges.totalCharge, handlingCharges]);

  // Calculate total price when cart items or coupon changes
  useEffect(() => {
    caliculateTotalPrice();
  }, [cartItems, appliedCoupon]);

  useEffect(() => {
    if (grandTotal > 700 && selectedPaymentMethod === "Cash On Delivery") {
      setSelectedPaymentMethod("Pay Online");
    }
  }, [grandTotal, selectedPaymentMethod]);



  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <StatusBarManager screenName="checkout" />
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <AntDesign name="arrowleft" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Checkout</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Support')}
            style={styles.supportButton}>
            <Icon name="support-agent" size={30} color="grey" />
          </TouchableOpacity>
        </View>

        {/* Savings Banner */}
        <ScrollView style={[styles.content, { marginBottom: responsiveHeight(25) }]}>
          <View style={styles.savingsBanner}>
            <MaterialCommunityIcons
              name="brightness-percent"
              color={commonStyles.appMainColor}
              size={15}
            />
            {totalSavings && (
              <Text style={styles.savingsText}>
                {' '}
                ₹{totalSavings} saved from this order
              </Text>
            )}
          </View>
          {/* Cart Items */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", margin: 10, paddingTop: 10 }}>
            <Text style={styles.checkoutSectionTitle}>Cart Items</Text>
            <TouchableOpacity
              style={styles.checkoutClearCartButton}
              onPress={() => setClearCartConfirmVisible(true)}
            >
              <Text style={styles.checkoutClearCartButtonText}>Clear Cart</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={cartItems}
            renderItem={renderCartItem}
            keyExtractor={item => item.id}
            scrollEnabled={false}
          />

          <View style={styles.totalContainer}>
            <TouchableOpacity
              onPress={() => navigation.navigate('BottomNavigation')}
              style={{}}>
              <Text style={styles.addMoreText}>+ Add more items</Text>
            </TouchableOpacity>
            <Text style={styles.totalPrice}>₹ {totalPrice}</Text>
          </View>

          {/* Delivery Details */}
          <View style={[styles.detailsCard]}>
            <Text style={styles.cardTitle}>Delivery Details</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AddressList', { isFromCart: true })} style={styles.address}>
              <View style={styles.addressSection}>
                <MaterialIcons name="home" size={24} color="#666" />
                <View style={styles.addressDetails}>
                  <Text style={styles.addressType}>
                    {selectedAddress?.address_type || 'No address selected'}
                  </Text>
                  <Text style={styles.addressText}>
                    {selectedAddress?.full_address || 'No address selected'}
                  </Text>
                </View>
                <Entypo
                  name="chevron-right"
                  size={24}
                  color="#666"
                  onPress={() =>
                    navigation.navigate('AddressList', { isFromCart: true })
                  }
                />
              </View>

              <View
                style={[
                  styles.dottedLineContainer,
                  styles.dottedLineContainerFull,
                  {
                    width: responsiveWidth(80),
                    overflow: 'hidden',
                    alignSelf: 'center',
                    marginBottom: 10,
                  },
                ]}>
                {Array(20)
                  .fill(0)
                  .map((_, index) => (
                    <View key={index} style={styles.dot} />
                  ))}
              </View>

              <View style={styles.contactSection}>
                <MaterialIcons name="person" size={24} color="#666" />
                <View style={styles.contactDetails}>
                  <Text style={styles.contactName}>
                    {selectedAddress?.customer_name || 'No name'}
                  </Text>
                  <Text style={styles.contactNumber}>
                    {selectedAddress?.customer_mobile_number || 'No contact'}
                  </Text>
                </View>
                <Entypo
                  name="chevron-right"
                  size={24}
                  color="#666"
                  onPress={() =>
                    navigation.navigate('AddressList', { isFromCart: true })
                  }
                />
              </View>
            </TouchableOpacity>
          </View>

          {/* Apply Coupons */}
          <TouchableOpacity onPress={navigateToCoupons} style={styles.couponCard}>
            <MaterialIcons name="local-offer" size={24} color={commonStyles.appMainColor} />
            <Text style={styles.couponText}>Apply coupons</Text>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>

          {/* Billing */}
          <Text style={styles.sectionTitle}>Billing</Text>
          <View style={styles.billingCard}>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Original Price</Text>
              <Text style={styles.billValue}>₹ {(totalSellingPrice + totalSavings).toFixed(2)}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Amount</Text>
              <Text style={styles.billValue}>₹ {totalSellingPrice.toFixed(2)}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Savings</Text>
              <Text style={styles.savingsValue}>₹ {totalSavings.toFixed(2)}</Text>
            </View>
            {appliedCoupon && <View style={styles.billRow}>
              <Text style={styles.billLabel}>Coupon Discount</Text>
              <Text style={styles.savingsValue}>₹ {couponDiscount.toFixed(2)}</Text>
            </View>}
            {/* {appliedCoupon && (
              <Text style={styles.couponCode}>{appliedCoupon?.coupon_name}</Text>
            )} */}
            {appliedCoupon && (
              <View style={styles.couponRow}>
                <Text style={styles.couponCode}>{appliedCoupon?.coupon_name}</Text>
                <TouchableOpacity onPress={() => {
                  dispatch(removeCoupon());
                  setCouponDiscount(0);
                  setItemsTotalPrice(totalSellingPrice);  // Reset the item price
                }}>
                  <Text style={styles.removeCouponText}>Remove</Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Total</Text>
              <Text style={styles.savingsValue}>
                ₹ {(itemsTotalPrice || totalSellingPrice - couponDiscount).toFixed(2)}
              </Text>
            </View>
            {/* <View
            style={[
              styles.dottedLineContainer,
              {
                marginVertical: 10,
                marginTop: 0,
                width: responsiveWidth(80),
                overflow: 'hidden',
              },
            ]}>
            {Array(20)
              .fill(0)
              .map((_, index) => (
                <View key={index} style={styles.dot} />
              ))}
          </View> */}

            {/* <View style={styles.billRow}>
            <Text style={styles.billLabel}>GST</Text>
            <Text style={styles.gstValue}>
              ₹{' '}
              {delivery.gstAmount.toFixed(2)}
            </Text>
          </View> */}
            <View
              style={[
                styles.dottedLineContainer,
                {
                  marginVertical: 10,
                  marginTop: 0,
                  width: responsiveWidth(80),
                  overflow: 'hidden',
                },
              ]}>
              {Array(20)
                .fill(0)
                .map((_, index) => (
                  <View key={index} style={styles.dot} />
                ))}
            </View>
            {/* Delivery Charges */}
            {delivery?.totalCharge > 0 && (
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Delivery Charges</Text>
                <Text style={styles.billValue}>
                  ₹ {delivery.totalCharge}
                </Text>
              </View>
            )}

            {/* Handling Charges */}
            {handlingCharges > 0 && (
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Handling Charges</Text>
                <Text style={styles.billValue}>₹ {handlingCharges.toFixed(2)}</Text>
              </View>
            )}

            <View
              style={[
                styles.dottedLineContainer,
                {
                  marginVertical: 10,
                  marginTop: 0,
                  width: responsiveWidth(80),
                  overflow: 'hidden',
                },
              ]}>
              {Array(20)
                .fill(0)
                .map((_, index) => (
                  <View key={index} style={styles.dot} />
                ))}
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL</Text>
              <Text style={styles.totalValue}>₹ {grandTotal.toFixed(2)}</Text>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Payment Section */}
        <View style={[styles.paymentSection, { position: 'absolute', bottom: "5%", width: '100%' }]}>
          {/* Payment Method Selection */}
          <View style={styles.paymentMethodContainer}>
            <Text style={styles.paymentMethodTitle}>Choose Payment Method</Text>
            <View style={styles.paymentButtonsContainer}>
              {/* Pay Online Button */}
              <TouchableOpacity
                style={[
                  styles.paymentMethodButton,
                  selectedPaymentMethod === 'Pay Online' && styles.paymentMethodButtonSelected
                ]}
                onPress={() => setSelectedPaymentMethod('Pay Online')}
                disabled={isProcessingPayment}>
                <MaterialIcons
                  name="credit-card"
                  size={20}
                  color={selectedPaymentMethod === 'Pay Online' ? '#fff' : commonStyles.appMainColor}
                />
                <Text style={[
                  styles.paymentMethodButtonText,
                  selectedPaymentMethod === 'Pay Online' && styles.paymentMethodButtonTextSelected
                ]}>
                  Pay Online
                </Text>
              </TouchableOpacity>

              {/* Cash On Delivery Button */}
              <TouchableOpacity
                style={[
                  styles.paymentMethodButton,
                  selectedPaymentMethod === 'Cash On Delivery' && styles.paymentMethodButtonSelected,
                  Number(grandTotal) > 700 && styles.paymentMethodButtonDisabled
                ]}
                onPress={() => setSelectedPaymentMethod('Cash On Delivery')}
                disabled={isProcessingPayment || Number(grandTotal) > 700}>
                <MaterialIcons
                  name="money"
                  size={20}
                  color={
                    Number(grandTotal) > 700
                      ? '#ccc'
                      : selectedPaymentMethod === 'Cash On Delivery'
                        ? '#fff'
                        : commonStyles.appMainColor
                  }
                />
                <Text style={[
                  styles.paymentMethodButtonText,
                  selectedPaymentMethod === 'Cash On Delivery' && styles.paymentMethodButtonTextSelected,
                  Number(grandTotal) > 700 && styles.paymentMethodButtonTextDisabled
                ]}>
                  COD
                </Text>
                {Number(grandTotal) > 700 && (
                  <Text style={styles.codLimitText}>Not available above ₹700</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Place Order Button */}
          <TouchableOpacity
            style={[
              styles.placeOrderButton,
              (!selectedPaymentMethod || isProcessingPayment) && { opacity: 0.6 }
            ]}
            onPress={handlePlaceOrder}
            disabled={isProcessingPayment || !selectedPaymentMethod}>
            {isProcessingPayment ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.placeOrderContent}>
                <View style={styles.orderTotal}>
                  <Text style={styles.orderTotalValue}>₹ {Number(grandTotal).toFixed(2)}</Text>
                  <Text style={styles.orderTotalLabel}>Total</Text>
                </View>
                <View style={styles.placeOrderTextContainer}>
                  <Text style={styles.placeOrderText}>Place Order</Text>
                  <MaterialIcons name="arrow-forward-ios" size={16} color="#fff" />
                </View>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Custom Modal for Missing User Details */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Missing Information</Text>
              <Text style={styles.modalMessage}>
                Please fill in your name and phone number in the address section.
              </Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setModalVisible(false)}>
                <Text style={styles.modalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <Modal
          animationType="slide"
          transparent={true}
          visible={clearCartConfirmVisible}
          onRequestClose={() => setClearCartConfirmVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Clear Cart?</Text>
              <Text style={styles.modalMessage}>
                Are you sure you want to clear all items from your cart?
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#FF4D4F' }]}
                  onPress={() => {
                    dispatch(clearCart());
                    setClearCartConfirmVisible(false);

                  }}
                >
                  <Text style={styles.modalButtonText}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#ccc' }]}
                  onPress={() => setClearCartConfirmVisible(false)}
                >
                  <Text style={[styles.modalButtonText, { color: '#333' }]}>No</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: commonStyles.appMainColor,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: responsiveWidth(5),
    paddingTop: responsiveHeight(6),
    paddingBottom: responsiveHeight(2),
  },
  backButton: {
    width: responsiveWidth(7),
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  profileButton: {
    width: responsiveWidth(7),
  },
  savingsText: {

    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
    // padding: responsiveWidth(5),
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    // marginBottom: responsiveHeight(2),
    marginLeft: responsiveWidth(5),
    marginVertical: responsiveHeight(2),
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  foodImage: {
    width: 82,
    height: 82,
    borderRadius: 12,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 16,
    gap: 3,
    justifyContent: 'center',
  },
  foodName: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
    width: '60%',
  },
  foodPrice: {
    fontSize: 16,
    color: commonStyles.appMainColor,
    fontWeight: '700',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: commonStyles.appMainColor,
    borderRadius: 6,
  },
  quantityButton: {
    padding: 5,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 5,
    color: commonStyles.appMainColor,
  },
  itemTotalPrice: {
    color: '#3D3D3D',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'right',
    marginTop: 3,
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: responsiveHeight(3),
  },
  addMoreText: {
    color: '#C3A710',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'left',
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: responsiveHeight(2),
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginLeft: responsiveWidth(2),
    marginBottom: 5,
  },
  addressSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
    gap: 10,
    // padding: 10,
    // paddingVertical: 15,
  },
  addressDetails: {
    flex: 1,
  },
  addressType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#3D3D3D',
    lineHeight: 18,
    fontWeight: '400',
  },
  contactSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  contactNumber: {
    fontSize: 12,
    color: '#666',
  },
  couponCard: {
    width: responsiveWidth(90),
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: responsiveHeight(2),
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: commonStyles.appMainColor,
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 3,
  },
  couponText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  billingCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: responsiveHeight(2),
    borderWidth: 1,
    width: responsiveWidth(90),
    alignSelf: 'center',
    borderColor: commonStyles.appMainColor,
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 3,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  billLabel: {
    fontSize: 16,
    color: '#525252',
    fontWeight: '500',
  },
  billValue: {
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
  },
  savingsValue: {
    fontSize: 15,
    color: '#525252',
    fontWeight: '500',
  },
  gstValue: {
    fontSize: 15,
    color: '#FFCB18',
    fontWeight: '500',
  },
  couponCode: {
    fontSize: 12,
    color: commonStyles.appMainColor,
    fontWeight: '500',
    marginLeft: 10,
  },
  gstNote: {
    fontSize: 12,
    color: '#666',
    marginLeft: 0,
    marginBottom: 15,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // borderTopWidth: 1,
    // borderTopColor: '#E0E0E0',
    paddingTop: 15,
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
  paymentSection: {
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  paymentMethodContainer: {
    marginBottom: 10,
  },
  paymentMethodTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    textAlign: 'center',
  },
  paymentButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  paymentMethodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e9ecef',
    gap: 6,
  },
  paymentMethodButtonSelected: {
    backgroundColor: commonStyles.appMainColor,
    borderColor: commonStyles.appMainColor,
  },
  paymentMethodButtonDisabled: {
    backgroundColor: '#f8f9fa',
    borderColor: '#dee2e6',
    opacity: 0.6,
  },
  paymentMethodButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: commonStyles.appMainColor,
  },
  paymentMethodButtonTextSelected: {
    color: '#fff',
  },
  paymentMethodButtonTextDisabled: {
    color: '#6c757d',
  },
  codLimitText: {
    fontSize: 9,
    color: '#dc3545',
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  placeOrderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: commonStyles.appMainColor,
    borderRadius: 6,
    // padding: 15,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  placeOrderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  orderTotal: {
    alignItems: 'flex-start',
  },
  orderTotalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  orderTotalLabel: {
    fontSize: 11,
    fontWeight: '400',
    color: '#fff',
  },
  placeOrderTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeOrderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginRight: 4,
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: responsiveWidth(5),
    marginTop: responsiveHeight(2),
  },
  totalPrice: {
    fontSize: 18,
    color: commonStyles.appMainColor,
    fontWeight: '700',
  },
  dottedLineContainer: {
    flexDirection: 'row',
    marginTop: 5,
    alignSelf: 'center',
  },
  dot: {
    width: 7, // Dot size
    height: 2,
    backgroundColor: '#D8D8D8', // Dot color
    borderRadius: 5, // Makes it circular
    marginHorizontal: 5, // Space between dots
  },
  savingsBanner: {
    width: responsiveWidth(90),
    alignSelf: 'center',
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: responsiveHeight(1.5),
    borderWidth: 1,

    borderRadius: 8,
    gap: 8,
    marginTop: responsiveHeight(2),
    // marginVertical: responsiveHeight(2),
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  supportButton: {
    width: 44,
    height: 44,
    backgroundColor: '#fff',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appliedCouponContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appliedCouponText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  removeCouponText: {
    fontSize: 16,
    fontWeight: '600',
    color: commonStyles.appMainColor,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: commonStyles.appMainColor,
    borderRadius: 5,
    padding: 10,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
  },
  totalText: {
    fontSize: 16,
    color: '#000',
  },
  amountText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  address: {
    marginHorizontal: responsiveWidth(1),
    borderWidth: 1,
    borderColor: commonStyles.appMainColor,
    borderRadius: 8,
  },
  address: {
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: commonStyles.appMainColor,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actualPrice: {
    fontSize: 14,
    color: '#666',
    textDecorationLine: 'line-through',
  },
  sellingPrice: {
    fontSize: 16,
    color: commonStyles.appMainColor,
    fontWeight: '700',
    textAlign: "left"
  },

  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,

  },

  removeCouponText: {
    color: '#FF4D4F',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  checkoutSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },

  checkoutClearCartButton: {
    backgroundColor: '#FF4D4F',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },

  checkoutClearCartButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },

  modalMessage: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
  },

  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    marginHorizontal: 10,
  },

  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },



});

export default CheckoutScreen;
