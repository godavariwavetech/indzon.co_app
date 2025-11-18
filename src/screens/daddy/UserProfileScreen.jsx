import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import {
  responsiveHeight,
  responsiveWidth,
} from 'react-native-responsive-dimensions';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { actionLogout, deleteAccount } from '../../redux/reducers/auth';
import { clearCart } from '../../redux/reducers/daddy';
import CustomModal from '../../components/CustomModal';
import commonStyles from '../../commonstyles/CommonStyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const UserProfileScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  // Get auth details from Redux
  const { customerId, token, mobileNumber, isLogged, locationName, locationId } = useSelector(
    state => state.Auth
  );
  const { userDetails, selectedAddress } = useSelector(state => state.address);
  const { addressList } = useSelector(state => state.Dashboard);
  
  // Get address data from addressList - use selectedAddress or first address
  const addressData = selectedAddress || (addressList && addressList.length > 0 ? addressList[0] : null);
  
  // Extract address components from full_address if not directly available
  const extractAddressComponents = React.useMemo(() => {
    if (!addressData?.full_address) {
      return { pincode: null, city: null, state: null };
    }
    
    const fullAddress = addressData.full_address;
    
    // Extract pincode (6-digit number, usually before country)
    const pincodeMatch = fullAddress.match(/\b(\d{6})\b/);
    const extractedPincode = pincodeMatch ? pincodeMatch[1] : null;
    
    // Extract city and state from address string
    // Format example: "... City, State PINCODE, Country"
    const parts = fullAddress.split(',').map(p => p.trim());
    
    let extractedCity = null;
    let extractedState = null;
    
    if (parts.length >= 2) {
      // Usually second-to-last part is "State PINCODE"
      const statePart = parts[parts.length - 2];
      // Remove pincode from state part if present
      extractedState = statePart?.replace(/\d{6}/, '').trim() || null;
      
      // City is usually third-to-last or second-to-last if no state
      if (parts.length >= 3) {
        extractedCity = parts[parts.length - 3] || null;
      } else if (parts.length === 2) {
        extractedCity = parts[0];
      }
    }
    
    return {
      pincode: extractedPincode,
      city: extractedCity,
      state: extractedState,
    };
  }, [addressData?.full_address]);
  
  // Use direct values from addressData if available, otherwise use extracted values
  const displayPincode = addressData?.pincode || extractAddressComponents.pincode;
  const displayCity = addressData?.city || extractAddressComponents.city;
  const displayState = addressData?.state || extractAddressComponents.state;

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDeleteAccount = async () => {
    try {
      setIsLoading(true);
      await dispatch(deleteAccount());
      setDeleteModalVisible(false);
      dispatch(actionLogout());
      dispatch(clearCart());
      navigation.reset({
        index: 0,
        routes: [{ name: 'LoginScreen' }],
      });
    } catch (error) {
      console.error('Error deleting account:', error);
      Alert.alert('Error', 'Failed to delete account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // User Details fields from addressList
  const userDetailFields = [
    {
      label: 'Name',
      value: addressData?.customer_name || 'Not set',
      icon: 'account',
    },
    {
      label: 'Contact',
      value: addressData?.customer_mobile_number || 'Not set',
      icon: 'phone-outline',
    },
    {
      label: 'Pincode',
      value: displayPincode || 'Not set',
      icon: 'map-marker-radius',
    },
    {
      label: 'City',
      value: displayCity || 'Not set',
      icon: 'city',
    },
    {
      label: 'State',
      value: displayState || 'Not set',
      icon: 'state-machine',
    },
    {
      label: 'Landmark',
      value: addressData?.landmark || 'Not set',
      icon: 'map-marker-star',
    },
    {
      label: 'Full Address',
      value: addressData?.full_address || 'Not set',
      icon: 'map-marker',
    },
  ];

  return (
    <View style={[styles.container]}>
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <AntDesign name="arrowleft" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Profile</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}>

        {/* User Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Details</Text>
          {addressData ? (
            userDetailFields.map((field, index) => {
              // Special handling for Full Address - display it below the label
              const isFullAddress = field.label === 'Full Address';
              return (
                <View key={index} style={isFullAddress ? styles.fullAddressRow : styles.fieldRow}>
                  <View style={styles.fieldLeft}>
                    <MaterialCommunityIcons
                      name={field.icon}
                      size={20}
                      color={commonStyles.btn2Color}
                    />
                    <Text style={styles.fieldLabel}>{field.label}</Text>
                  </View>
                  {isFullAddress ? (
                    <View style={styles.fullAddressContainer}>
                      <Text style={styles.fullAddressValue}>
                        {field.value}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.fieldValue} numberOfLines={1}>
                      {field.value}
                    </Text>
                  )}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="map-marker-off"
                size={40}
                color="#ccc"
              />
              <Text style={styles.emptyStateText}>No address data available</Text>
              <Text style={styles.emptyStateSubText}>
                Please add an address to see your details
              </Text>
            </View>
          )}
        </View>

        {/* Delete Account Button */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => setDeleteModalVisible(true)}
          disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="delete" size={20} color="#fff" />
              <Text style={styles.deleteButtonText}>Delete Account</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <CustomModal
        visible={deleteModalVisible}
        title="Delete Account"
        message="Are you sure you want to delete your account? This action cannot be undone."
        confirmText="Delete"
        onConfirm={handleDeleteAccount}
        onCancel={() => setDeleteModalVisible(false)}
        cancelText="Cancel"
        confirmButtonColor="#FF4B4B"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: commonStyles.btn2Color,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: responsiveWidth(5),
    paddingVertical: responsiveHeight(2),
  },
  backButton: {
    width: responsiveWidth(10),
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: responsiveHeight(5),
  },
  profileCard: {
    backgroundColor: '#fff',
    margin: responsiveWidth(5),
    borderRadius: 12,
    padding: responsiveWidth(5),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: responsiveHeight(2),
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginTop: responsiveHeight(1),
  },
  profileSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: responsiveHeight(0.5),
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: responsiveWidth(5),
    marginTop: responsiveHeight(2),
    borderRadius: 12,
    padding: responsiveWidth(4),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: responsiveHeight(1.5),
    paddingBottom: responsiveHeight(1),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: responsiveHeight(1.2),
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  fullAddressRow: {
    flexDirection: 'column',
    paddingVertical: responsiveHeight(1.2),
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  fieldLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: responsiveWidth(3),
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  fieldValue: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    textAlign: 'right',
  },
  fullAddressContainer: {
    marginTop: responsiveHeight(0.5),
    paddingLeft: responsiveWidth(11), // Align with field labels (icon + gap)
  },
  fullAddressValue: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    flexWrap: 'wrap',
  },
  deleteButton: {
    backgroundColor: '#FF4B4B',
    marginHorizontal: responsiveWidth(5),
    marginTop: responsiveHeight(3),
    marginBottom: responsiveHeight(2),
    paddingVertical: responsiveHeight(1.8),
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: responsiveWidth(2),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: responsiveHeight(3),
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: responsiveHeight(1),
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#999',
    marginTop: responsiveHeight(0.5),
    textAlign: 'center',
  },
});

export default UserProfileScreen;

