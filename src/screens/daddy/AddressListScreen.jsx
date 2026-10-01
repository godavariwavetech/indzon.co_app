import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  RefreshControl,
  Modal,
  StatusBar,
} from 'react-native';
import { responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { useDispatch, useSelector } from 'react-redux';
import { checkAddressExistence, deleteAddress, getAddressList } from '../../redux/reducers/daddy';
import { useFocusEffect } from '@react-navigation/native';
import CustomModal from '../../components/CustomModal';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { setSelectedAddress as setSelectedAddressAction, setUserDetails } from '../../redux/reducers/addressSlice';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { haversineDistance } from './distanceCalculator';
import commonStyles from '../../commonstyles/CommonStyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

const AddressListScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { addressList } = useSelector(state => state.Dashboard);
  // const {userAddress} = useSelector(state => state.address);
  const { userDetails } = useSelector(state => state.address)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [toggleValue, setToggleValue] = useState(false)
  const [refreshing, setRefreshing] = useState(false);
  const { customerId, token,locationId,reaturantDetails } = useSelector(state => state.Auth);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [isCheckingAddress, setIsCheckingAddress] = useState(false);
  const insets = useSafeAreaInsets();
  // Check if the user is coming from the cart screen
  const isFromCart = route.params?.isFromCart;

  
  console.log(reaturantDetails
    , "reaturantDetails in addresess list")

  const handleSelectAddress = async (address) => {
    try {
      setIsCheckingAddress(true);

      const value = haversineDistance(
        address?.customer_latitude,
        address?.customer_longitude,
        reaturantDetails?.shop_latitude,
        reaturantDetails?.shop_longitude,
      );

      const response = await dispatch(checkAddressExistence({
        latitude: parseFloat(address?.customer_latitude),
        longitude: parseFloat(address?.customer_longitude)
      }));

      // Check if response is valid
      if (response.payload?.status === 300) {
        dispatch(setSelectedAddress(address))
        // Handle case where address is not available
        setShowAddressModal(true);
        return;
      }

      if (response.payload?.data?.length > 0 && Number(value) <= Number(reaturantDetails?.maximum_del_km)) {
        dispatch(setSelectedAddressAction(address));
        if (isFromCart) {
          navigation.navigate('Checkout');
        }
      } else {
        setShowAddressModal(true);
      }
    } catch (error) {
      console.error("Error checking address:", error);
      setShowAddressModal(true);
    } finally {
      setIsCheckingAddress(false);
    }
  };

  useFocusEffect(useCallback(() => {
    loadAddresses();
  }, [isDeleted, dispatch]));

  const loadAddresses = async () => {
    if (!hasLoaded) {
      setIsLoading(true);
    }
    try {
      await dispatch(getAddressList());
      setToggleValue(!toggleValue);
      setHasLoaded(true);
    } catch (error) {
      console.error('Error loading addresses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePress = (address) => {
    setSelectedAddress(address);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    const res = await dispatch(deleteAddress({ addressId: selectedAddress.id }));
    setDeleteModalVisible(false);
    setSelectedAddress(null);
    setIsDeleted(!isDeleted);
  };

  const handleCancelDelete = () => {
    setDeleteModalVisible(false);
    setSelectedAddress(null);
  };

  const handleAddAddress = (address) => {
    if (!token && customerId) {
      setShowLoginModal(true);
    } else {
      dispatch(setUserDetails(address))
      navigation.navigate('AddAddress');
    }
  };

  const renderAddress = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.addressCard}
        onPress={() => handleSelectAddress(item)}
        disabled={isCheckingAddress || !isFromCart}
      >
        <View style={styles.addressHeader}>
          <Text style={styles.addressType}>{item.address_type}</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity onPress={() => navigation.navigate('AddAddress', { address: item })}>
              <Feather name="edit-2" size={20} color="#525252" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeletePress(item)}>
              <Ionicons name="trash-outline" size={20} color="#525252" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.addressText}>{item.full_address}</Text>
        <View style={styles.contactContainer}>
          <Text style={styles.contactText}>{item?.customer_name}  {'\u2022'}  {item?.customer_mobile_number}</Text>
        </View>
      </TouchableOpacity>
    )
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="location-off" size={80} color="#CCCCCC" />
      {!customerId ? (
        <>
          <Text style={styles.emptyTitle}>Sign In Required</Text>
          <Text style={styles.emptyText}>
            Please sign in to view or add your delivery addresses.
          </Text>
          <TouchableOpacity
            style={styles.addAddressButton}
            onPress={() => {
              setShowLoginModal(false);
              navigation.navigate('Register1', { isFromCart: true });
            }}
          >
            <Text style={styles.addAddressButtonText}>Sign In</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.emptyTitle}>No Addresses Found</Text>
          <Text style={styles.emptyText}>
            You haven't added any delivery addresses yet.
          </Text>
          <TouchableOpacity
            style={styles.addAddressButton}
            onPress={() => handleAddAddress(null)}
          >
            <Text style={styles.addAddressButtonText}>Add New Address</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );


  const onRefresh = async () => {
    setRefreshing(true);
    await loadAddresses();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      {/* <StatusBar backgroundColor={commonStyles.btn2Color} barStyle="light-content" translucent /> */}

      <LinearGradient colors={['#D14A00', '#6C2600']} style={[styles.header, { paddingTop: insets.top+10 }]}>
      {/* <View style={[styles.header, { paddingTop: insets.top }]}> */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <FontAwesome6 name="arrow-left-long" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Address List</Text>
      {/* </View> */}
      </LinearGradient>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={commonStyles.appMainColor} />
          <Text style={styles.loadingText}>Loading addresses...</Text>
        </View>
      ) : (
        <FlatList
          data={isFromCart ? addressList.filter(address => address.location_id === locationId) : addressList}
          renderItem={renderAddress}
          keyExtractor={item => item?.id?.toString()}
          contentContainerStyle={[
            styles.listContainer,
            addressList.length === 0 && styles.emptyListContainer
          ]}
          key={toggleValue}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmptyList}
          onScrollToIndexFailed={({ index, highestMeasuredFrameIndex }) => {
            console.warn(`Failed to scroll to index ${index}`);
          }}
          getItemLayout={(data, index) => ({
            length: 120,
            offset: 120 * index,
            index,
          })}
        />
      )}

      
      {customerId &&  <TouchableOpacity style={styles.addButton} onPress={handleAddAddress}>
        <Icon name="add" size={30} color="#fff" />
      </TouchableOpacity>}
      

      <CustomModal
        visible={deleteModalVisible}
        title="Delete Address"
        message="Are you sure you want to delete this address? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        confirmText="Delete"
        cancelText="Cancel"
      />


      {showLoginModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Sign In Required</Text>
            <Text style={styles.modalText}>
              You need to sign in to continue.
            </Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowLoginModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => {
                  setShowLoginModal(false);
                  navigation.navigate('Register1', { isFromCart: true });
                }}
              >
                <Text style={styles.confirmButtonText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      <CustomModal
        visible={showAddressModal}
        title="Address Not Available"
        message="The selected address is not available for delivery. Please select another address."
        onConfirm={() => setShowAddressModal(false)}
        confirmText="OK"
        cancelText=""
      // showCancel={false}
      />
      {isCheckingAddress && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={commonStyles.appMainColor} />
        </View>
      )}
    </View>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: responsiveHeight(10)
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: responsiveHeight(2),
    fontSize: 16,
    color: commonStyles.appMainColor,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: responsiveWidth(5),
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginTop: responsiveHeight(2),
    marginBottom: responsiveHeight(1),
  },
  emptyText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: responsiveHeight(3),
  },
  addAddressButton: {
    backgroundColor: commonStyles.appMainColor,
    paddingVertical: responsiveHeight(1.5),
    paddingHorizontal: responsiveWidth(10),
    borderRadius: 8,
  },
  addAddressButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    // backgroundColor: commonStyles.appMainColor,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: responsiveWidth(6),
     paddingVertical: responsiveHeight(3),
    // paddingTop: responsiveHeight(6),
    // paddingBottom: 20,
    gap: 10,
    borderBottomLeftRadius:16,
    borderBottomRightRadius:16,
    width: '100%',
    flexShrink: 0,
  },
  backButton: {
    width: responsiveWidth(7)
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textAlign: "left"

  },
  addressCard: {
    backgroundColor: '#fff',
    marginHorizontal: responsiveWidth(5),
    marginVertical: responsiveHeight(1),
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#A3A3A3",
    gap: 10
  },
  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  addressType: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: "left"
  },
  addressText: {
    fontSize: 14,
    color: '#3D3D3D',
    textAlign: "left",
    fontWeight: "600",
    width: responsiveWidth(70)
  },
  contactContainer: {
    flexDirection: "row"
  },
  contactText: {
    fontSize: 12,
    color: '#3D3D3D',
    textAlign: "left",
    fontWeight: "600"
  },
  addButton: {
    position: 'absolute',
    bottom: "10%",
    right: "10%",
    backgroundColor: commonStyles.appMainColor,
    borderRadius: 50,
    padding: 10,
    elevation: 5
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
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
  modalButtonContainer: {
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
    backgroundColor: "#FE4A31",
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});

export default AddressListScreen;
