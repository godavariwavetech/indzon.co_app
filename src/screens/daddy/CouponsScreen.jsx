import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';
import { applyCoupon, fetchCoupons, removeCoupon } from '../../redux/reducers/coupons';
import StatusBarManager from '../../components/StatusBarManager';
import commonStyles from '../../commonstyles/CommonStyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


const CouponsScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const {appliedCoupon} = useSelector(state => state.coupons);
  const {totalPrice} = useSelector(state => state.Dashboard);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const coupons = useSelector(state => state.coupons.coupons) || [];
  const dispatch = useDispatch();

  
  const { chargesList, selectedAddress ,} = useSelector(
    state => state.address,
  );
  const { reaturantDetails} = useSelector(
    state => state.Auth,
  );
  console.log("hieeeegggggggggggggg",reaturantDetails)


  const handleApplyCoupon = (coupon) => {
    if (totalPrice >= coupon.coupon_upto_price) {
      setSelectedCoupon(coupon);
    } else {
      setErrorMessage(`This coupon requires a minimum order value of ₹${coupon.coupon_upto_price}.`);
      setErrorModalVisible(true);
    }
  };



  const handleConfirmApply = () => {
   
    if (selectedCoupon && route.params?.onCouponSelect) {
      dispatch(applyCoupon(selectedCoupon));
      route.params.onCouponSelect(selectedCoupon);
      setSuccessModalVisible(true);
      // setTimeout(() => {
      //   navigation.goBack();
      // }, 2000);
    }
  };

  const handleRemoveCoupon = () => {
    if (selectedCoupon) {
      dispatch(removeCoupon(selectedCoupon.id)); // Dispatch action to remove the coupon
      setSelectedCoupon(null); // Clear the selected
      Alert.alert("Coupon Removed", "The coupon has been successfully removed.");
    }
  };

  useEffect(() => {
    const shopId = reaturantDetails?.shop_id;
    const locationId = selectedAddress?.location_id;
    const categoryId = reaturantDetails?.category_id;
    if (shopId && locationId && categoryId) {
      dispatch(fetchCoupons({ shop_id: shopId, location_id: locationId, category_id: categoryId }));
    }
  }, [dispatch, reaturantDetails?.shop_id, reaturantDetails?.category_id, selectedAddress?.location_id]);


  return (
    <>
    <StatusBarManager screenName="coupons" />
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
              <AntDesign name="arrowleft" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Available Coupons</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: selectedCoupon ? 140 : 24 }}
      >
        {coupons.length === 0 ? (
          <View style={{flex: 1, alignItems: 'center', justifyContent: 'center',height:responsiveHeight(80)}}>
            <MaterialIcons name="local-offer" size={60} color="#E0E0E0" />
            <Text style={{fontSize: 18, color: '#888', fontWeight: '600', marginTop: 16}}>No Coupons Available</Text>
            <Text style={{fontSize: 14, color: '#aaa', marginTop: 8, textAlign: 'center', maxWidth: 250}}>
              There are currently no coupons to display. Please check back later!
            </Text>
          </View>
        ) : (
          coupons.map((coupon) => (
            <TouchableOpacity
              key={coupon.id}
              style={[
                styles.couponCard,
                (selectedCoupon?.id||appliedCoupon?.id) === coupon.id && styles.selectedCouponCard
              ]}
              onPress={() => handleApplyCoupon(coupon)}
            >
              <View style={styles.couponLeft}>
                <View style={styles.couponIconContainer}>
                  <MaterialIcons name="local-offer" size={24} color="#065E2C" />
                </View>
                <View style={styles.couponDetails}>
                  <Text style={styles.couponName}>{coupon.coupon_name}</Text>
                  <Text style={styles.couponDescription}>{coupon.coupon_description}</Text>
                  <View style={styles.couponTerms}>
                    <Text style={styles.couponTermsText}>
                      • Min. order value: ₹{coupon.coupon_upto_price}
                    </Text>
                    <Text style={styles.couponTermsText}>
                      • Max. discount: ₹{coupon.coupon_max_price_limit}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.couponRight}>
                <Text style={styles.discountText}>{coupon.coupon_percentage}%</Text>
                <Text style={styles.offText}>OFF</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {selectedCoupon && (
        <View style={[styles.bottomContainer, { bottom: insets.bottom + 8 }]}>
          <TouchableOpacity 
            style={styles.applyButton}
            onPress={handleConfirmApply}
          >
            <Text style={styles.applyButtonText}>Apply Coupon</Text>
            <AntDesign name="arrowright" size={20} color="#fff" />
          </TouchableOpacity>
          {/* <TouchableOpacity 
            style={styles.removeButton}
            onPress={handleRemoveCoupon}
          >
            <Text style={styles.removeButtonText}>Remove Coupon</Text>
          </TouchableOpacity> */}
        </View>
      )}

      {/* Success Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={successModalVisible}
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Coupon Applied!</Text>
            <Text style={styles.modalText}>The coupon has been successfully applied.</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setSuccessModalVisible(false);
                navigation.goBack();
              }}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={errorModalVisible}
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Coupon Not Applicable</Text>
            <Text style={styles.modalText}>{errorMessage}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setErrorModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
    </>
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
    paddingBottom: responsiveHeight(2),
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: responsiveWidth(5),
    paddingBottom: responsiveHeight(10), // Add padding for the button
  },
  couponCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  selectedCouponCard: {
    borderColor: '#065E2C',
    backgroundColor: '#F5FFF8',
  },
  couponLeft: {
    flex: 1,
    flexDirection: 'row',
    gap: 15,
  },
  couponIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponDetails: {
    flex: 1,
  },
  couponName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  couponDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  couponTerms: {
    gap: 4,
  },
  couponTermsText: {
    fontSize: 12,
    color: '#666',
  },
  couponRight: {
    alignItems: 'center',
    paddingLeft: 15,
    borderLeftWidth: 1,
    borderLeftColor: '#E0E0E0',
  },
  discountText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#065E2C',
  },
  offText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065E2C',
  },
  bottomContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: responsiveWidth(5),
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  applyButton: {
    backgroundColor: commonStyles.appMainColor,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    gap: 10,
  },
  removeButton: {
    backgroundColor: '#FF4D4D',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    marginTop: 10,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 16,
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
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 14,
    marginBottom: 20,
    textAlign:"center"
  },
  closeButton: {
    backgroundColor: commonStyles.appMainColor,
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default CouponsScreen;
