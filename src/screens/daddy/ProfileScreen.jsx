import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
  Platform,
  ActivityIndicator,
  Linking,
  RefreshControl,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  responsiveHeight,
  responsiveWidth,
} from 'react-native-responsive-dimensions';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import Octicons from 'react-native-vector-icons/Octicons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
// import { logout } from '../../redux/reducers/daddy';
import CustomModal from '../../components/CustomModal';
import { actionLogout } from '../../redux/reducers/auth';
import { clearCart, getOrders } from '../../redux/reducers/daddy';
import VersionCheck from 'react-native-version-check';
import commonStyles from '../../commonstyles/CommonStyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { customerId } = useSelector(state => state.Auth);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { userDetails } = useSelector(state => state.address);
  const [orders, setOrders] = useState([]);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [appVersion, setAppVersion] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const getOrdersData = async () => {
    try {
      setIsLoading(true);
      const response = await dispatch(getOrders({ orderId: 0 }));
      response.payload.data.length > 0 && setOrders([response.payload.data[0]]);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getOrdersData();
  }, []);

  useEffect(() => {
    const getVersion = async () => {
      try {
        const version = await VersionCheck.getCurrentVersion();
        setAppVersion(version);
      } catch (error) {
        console.error('Error getting app version:', error);
      }
    };
    getVersion();
  }, []);

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

  const getOrderStatus = status => {
    return STATUS_MAP[status] || 'Unknown Status';
  };

  const getStatusColor = status => {
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

  const handleUpdate = async () => {
    try {
      console.info('Checking for updates...');
    } catch (error) {
      console.error('Play Store error:', error);
    } finally {
      setShowUpdateModal(false);
    }
  };

  const handleConfirmLogout = () => {
    setLogoutModalVisible(false);
    dispatch(actionLogout());
    dispatch(clearCart());
  };

  const handleCheckForUpdate = async () => {
    try {
      const res = await VersionCheck.needUpdate();
      if (res.isNeeded) {
        setShowUpdateModal(true);
      } else {
        setUpdateModalVisible(true); // Show "latest version" modal
        setShowUpdateModal(false); // Ensure update modal is hidden
      }
    } catch (error) {

      setUpdateModalVisible(true); // Show error message
      setShowUpdateModal(false);
    }
  };

  const renderOrder = ({ item }) => (
    <View style={styles.orderCard}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: responsiveHeight(0.5),
        }}>
        <Text style={styles.orderId}>Order ID: {item?.order_id}</Text>
        <Text
          style={[
            styles.orderStatus,
            { color: getStatusColor(item?.order_status) },
          ]}>
          {getOrderStatus(item?.order_status)}
        </Text>
      </View>

      <Text style={styles.orderDetails} numberOfLines={1}>
        Delivered to:{' '}
        <Text style={{ fontWeight: '400' }} numberOfLines={1}>
          {item?.delivery_address}
        </Text>
      </Text>

      <Text style={styles.orderDate}>
        {item?.order_date} at {item?.order_time}
      </Text>

      <View style={styles.restaurantInfo}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            marginVertical: responsiveHeight(1),
          }}>
          <Image
            source={{ uri: item?.shop_image }}
            style={{
              width: responsiveWidth(15),
              height: responsiveWidth(15),
              borderRadius: 10,
            }}
          />
          <View style={{ width: responsiveWidth(50) }}>
            <Text style={styles.restaurantName} numberOfLines={1}>
              {item?.shop_name}
            </Text>
            <Text style={styles.menuItem} numberOfLines={1}>
              {item?.item_count} item{Number(item?.item_count) > 1 ? 's' : ''} •{' '}
              {item?.slot_timings}
            </Text>
          </View>
          <Text style={styles.price}>₹{item?.grand_total}</Text>
        </View>
      </View>
    </View>
  );


  const menuItems = [


    // 2. Core navigation / features
    {
      id: '12',
      title: 'User Profile',
      icon: <MaterialCommunityIcons name="account" size={24} color={commonStyles.appMainColor} />,
      // onPress: () => navigation.navigate('UserProfile'),
      onPress: () => navigation.navigate('UserProfileScreenLatest'),
    },
    {
      id: '2',
      title: 'Address List',
      icon: <Ionicons name="clipboard-outline" size={24} color={commonStyles.appMainColor} />,
      onPress: () => navigation.navigate('AddressList'),
    },
    {
      id: '3',
      title: 'Support',
      icon: <MaterialCommunityIcons name="help-circle-outline" size={24} color={commonStyles.appMainColor}/>,
      onPress: () => navigation.navigate('Support'),
    },
    {
      id: '4',
      title: 'App Feedback',
      icon: (
        <MaterialCommunityIcons
          name="card-bulleted-outline"
          size={24}
          color={commonStyles.appMainColor}
        />
      ),
      onPress: () => navigation.navigate('Feedback'),
    },

    {
      id: '11',
      title: 'Notifications',
      icon: <Ionicons name="notifications-outline" size={24} color={commonStyles.appMainColor} />,
      onPress: () => navigation.navigate('Notifications'),
    },

    // 3. App-related info
    {
      id: '8',
      title: 'Check for Updates',
      icon: <MaterialCommunityIcons name="update" size={24} color={commonStyles.appMainColor}/>,
      onPress: handleCheckForUpdate,
    },

    // 4. Legal & informational links
    {
      id: '1',
      title: 'About Us',
      icon: (
        <MaterialCommunityIcons
          name="information-outline"
          size={24}
          color={commonStyles.appMainColor}
        />
      ),
      onPress: () => Linking.openURL('https://melocalapp.com/about/'),
      isExternal: true,
      url: 'https://melocalapp.com/about/',
    },
    {
      id: '5',
      title: 'Privacy Policy',
      icon: (
        <MaterialCommunityIcons
          name="shield-account"
          size={24}
          color={commonStyles.appMainColor}
        />
      ),
      onPress: () => Linking.openURL('https://melocalapp.com/privacypolicy/'),
      isExternal: true,
      url: 'https://melocalapp.com/privacypolicy/',
    },
    {
      id: '6',
      title: 'Terms and Conditions',
      icon: (
        <MaterialCommunityIcons
          name="file-document"
          size={24}
          color={commonStyles.appMainColor}
        />
      ),
      onPress: () => Linking.openURL('https://melocalapp.com/terms/'),
      isExternal: true,
      url: 'https://melocalapp.com/terms/',
    },
    {
      id: '7',
      title: 'Refund Policy',
      icon: (
        <MaterialCommunityIcons
          name="credit-card-refund-outline"
          size={24}
          color={commonStyles.appMainColor}
        />
      ),
      onPress: () => Linking.openURL('https://melocalapp.com/refundpolicy/'),
      isExternal: true,
      url: 'https://melocalapp.com/refundpolicy/',

    },

    // 1. Account actions (high priority for signed-in/out status)
    customerId
      ? {
        id: '9',
        title: 'Logout',
        icon: <Feather name="log-out" size={24} color={commonStyles.appMainColor} />,
        onPress: () => setLogoutModalVisible(true),
      }
      : {
        id: '9',
        title: 'Login',
        icon: (
          <MaterialCommunityIcons name="login" size={24} color="#000" />
        ),
        onPress: () => navigation.navigate('Register1', { isFromCart: true }),
      },
  ];



  return (
    <View style={styles.container}>
      {/* <LinearGradient colors={['#FD0', '#F7F2F2']} style={styles.gradientContainer}> */}
      {/* <LinearGradient colors={['#D14A00', '#6C2600']} style={[styles.gradientContainer, { paddingTop: insets.top+10 }]}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            // marginTop: responsiveHeight(5),
            marginHorizontal: responsiveWidth(5),
          }}>
          <Image
            source={require("../daddy/tabassets/dummy-profile.png")}
            style={{
              width: responsiveWidth(10),
              height: responsiveWidth(10),
              borderRadius: 100,
            }}
          />
          <Text style={styles.profileName}>
            {userDetails?.name || 'Hello User'}
          </Text>
        </View>
      </LinearGradient> */}

      <LinearGradient
        colors={['#D14A00', '#6C2600']}
        style={[styles.headerGradient, { paddingTop: insets.top }]}>

        <View style={styles.headerContent}>
          {/* <View style={{ flexDirection: 'column'}}> */}
            {/* Back Button */}
            {/* <TouchableOpacity style={styles.backButton} onPress={()=> navigation.goBack()}>
              <Icon name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity> */}

            {/* Profile Info */}
            <View style={styles.profileInfo}>
              <Text style={styles.nameText}>Jani</Text>
              <Text style={styles.contactText}>
                +91 9965841257 | sachine@gmail.com
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('UserProfileScreenLatest')}>
                <Text style={styles.editProfileText}>Edit Profile ›</Text>
              </TouchableOpacity>
            </View>
          {/* </View> */}

          {/* Profile Picture */}
          <Image
            source={require("../daddy/tabassets/dummy-profile.png")} // Replace with your avatar
            style={styles.profileImage}
          />
        </View>
      </LinearGradient>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}

        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await getOrdersData();
              setRefreshing(false);
            }}
          />
        }>
        <View style={styles.ordersHeader}>
          <Text style={styles.ordersTitle}>Your Orders</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Reorder')}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        {isLoading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={commonStyles.appMainColor} />
          </View>
        ) : orders.length > 0 ? (
          <View >
            <FlatList
              data={orders}
              renderItem={renderOrder}
              keyExtractor={item => item?.order_id}
              contentContainerStyle={styles.listContainer}
            />
          </View>
        ) : (
          <View style={styles.noOrdersContainer}>
            <MaterialCommunityIcons name="food-off" size={50} color="#A3A3A3" />
            <Text style={styles.noOrdersText}>No recent orders found</Text>
          </View>
        )}
        <View style={styles.menuOptions}>
          {menuItems.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItemMain}
              onPress={item.onPress}>
              <View style={styles.menuItemLeft}>
                {item.icon}
                <Text style={[styles.menuText]}>{item.title}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {item.isExternal ? (
                  <Ionicons name="open-outline" size={20} color={commonStyles.appMainColor} style={{ marginRight: 8 }} />
                ) : (
                  <Icon name="chevron-right" size={24} color={commonStyles.appMainColor} />
                )}
              </View>
            </TouchableOpacity>
          ))}
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>
              App Version: {appVersion || '1.0.0'}
            </Text>
          </View>
        </View>
      </ScrollView>

      <CustomModal
        visible={updateModalVisible}
        title={showUpdateModal ? 'Update Available' : 'App Updated'}
        message={
          showUpdateModal
            ? 'A new version is available. Please update now!'
            : "You're using the latest version of MeLocal"
        }
        confirmText="OK"
        onConfirm={() => setUpdateModalVisible(false)}
        showCancel={false}
        cancelText=""
      />

      <CustomModal
        visible={logoutModalVisible}
        title="Logout"
        message="Are you sure do you want to logout?"
        onConfirm={handleConfirmLogout}
        onCancel={() => setLogoutModalVisible(false)}
        confirmText="Logout"
        cancelText="Cancel"
      />

      <CustomModal
        visible={showUpdateModal}
        title="Update Available"
        message="A new version of MeLocal is available. Please update to continue using all features."
        confirmText="Update Now"
        onConfirm={handleUpdate}
        onCancel={() => setShowUpdateModal(false)}
        cancelText="Later"
      />

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: Platform.OS === 'ios' ? 90 : 100, // Add padding for tab bar
  },
  header: { padding: 20, backgroundColor: commonStyles.yellowColor, alignItems: 'center' },
  profileName: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  ordersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  ordersTitle: { fontSize: 18, fontWeight: 'bold' },
  viewAll: { color: commonStyles.appMainColor, fontWeight: 'bold' },
  orderCard: {
    backgroundColor: '#fff',
    marginHorizontal: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    paddingVertical: 15,
    elevation: 3,
    width: responsiveWidth(95) - 20
  },
  orderId: { fontSize: 14, fontWeight: '500', color: '#3D3D3D', width: responsiveWidth(40) },
  orderStatus: { color: commonStyles.appMainColor, fontWeight: '600', fontSize: 14, width: responsiveWidth(40), textAlign: 'right' },
  orderDetails: {
    fontSize: 12,
    color: '#3D3D3D',
    fontWeight: '600',
    width: responsiveWidth(65),
    marginBottom: responsiveHeight(0.3),
  },
  orderDate: {
    fontSize: 12,
    color: '#525252',
    fontWeight: '400',
    marginBottom: responsiveHeight(0.3),
  },
  restaurantInfo: { marginVertical: 0 },
  restaurantName: { fontSize: 16, fontWeight: 'bold' },
  menuItem: { fontSize: 14, color: '#555' },
  price: {
    fontSize: 16,
    color: commonStyles.appMainColor,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // marginTop: 10,
  },
  reorderButton: {
    backgroundColor: '#fff',
    // padding: 5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#A3A3A3',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    width: responsiveWidth(38),
    //  paddingHorizontal:20
  },
  // rateButton: {
  //   backgroundColor: '#00773F',
  //   // padding: 5,
  //   borderRadius: 5,
  //   width: responsiveWidth(38),
  //   alignItems: 'center',
  //   justifyContent: 'center',
  // },
  buttonText: { color: '#A3A3A3', fontWeight: 'bold' },
  menuOptions: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 85 : 60, // Add extra padding to menu options
  },
  menuItemMain: {
    paddingVertical: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: commonStyles.appMainColor,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveWidth(3),
  },
  menuText: { fontSize: 16, color: '#000', fontWeight: '600', textAlign: 'left' },
  gradientContainer: {
    paddingVertical: 10,
  },
  dottedLineContainer: {
    flexDirection: 'row',
    marginTop: responsiveHeight(2),
    alignSelf: 'center',
  },
  dot: {
    width: 5, // Dot size
    height: 2,
    backgroundColor: '#D8D8D8', // Dot color
    borderRadius: 5, // Makes it circular
    marginHorizontal: 5, // Space between dots
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  noOrdersContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
    padding: 20,
  },
  noOrdersText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#313131',
    marginTop: 15,
    marginBottom: 5,
  },
  noOrdersSubText: {
    fontSize: 14,
    color: '#A3A3A3',
    textAlign: 'center',
  },
  versionContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 7,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    left: 10,
  },
  versionText: {
    fontSize: 14,
    color: commonStyles.appMainColor,
    fontWeight: '500',
    textAlign: 'center',
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loginPrompt: {
    fontSize: 18,
    color: '#333',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: commonStyles.appMainColor,
    padding: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 10,
  },

  headerGradient: {
    paddingBottom: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom:16,
  },
  backButton: {
    padding: 5,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 15,
  },
  nameText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  contactText: {
    fontSize: 14,
    color: '#fff',
    marginTop: 4,
    opacity: 0.95,
  },
  editProfileText: {
    color: '#fff',
    fontSize: 15,
    marginTop: 8,
    fontWeight: '500',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#fff',
    marginTop:12
  },

});

export default ProfileScreen;
