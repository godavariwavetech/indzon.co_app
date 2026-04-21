import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  ActivityIndicator,
  Linking,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  responsiveHeight,
  responsiveWidth,
} from 'react-native-responsive-dimensions';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import VersionCheck from 'react-native-version-check';

import CustomModal from '../../components/CustomModal';
import { actionLogout } from '../../redux/reducers/auth';
import { clearCart, getOrders } from '../../redux/reducers/daddy';
import commonStyles from '../../commonstyles/CommonStyles';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const { customerId, mobileNumber } = useSelector((state) => state.Auth);
  const { userDetails, selectedAddress } = useSelector((state) => state.address);
  const addressList = useSelector((state) => state.Dashboard?.addressList);

  const addressData = selectedAddress || (addressList && addressList.length > 0 ? addressList[0] : null);

  const displayName = userDetails?.name || addressData?.customer_name || 'Guest User';
  const displayPhone = userDetails?.phone || addressData?.customer_mobile_number || mobileNumber || 'N/A';
  const displayEmail = userDetails?.email || addressData?.email || 'N/A';

  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [appVersion, setAppVersion] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  console.log('userDetails', userDetails);
  console.log('addressData', addressData);

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
        setUpdateModalVisible(true);
        setShowUpdateModal(false);
      }
    } catch (error) {
      setUpdateModalVisible(true);
      setShowUpdateModal(false);
    }
  };

  // --- Menu Configurations ---

  const generalMenuItems = [
    {
      id: '1',
      title: 'Account',
      icon: <MaterialCommunityIcons name="account" size={24} color="#85360B" />,
      onPress: () => navigation.navigate('UserProfileScreenLatest'),
    },
    {
      id: '2',
      title: 'Your Orders',
      icon: <Feather name="box" size={22} color="#85360B" />,
      onPress: () => navigation.navigate('Reorder'), // Or your Orders screen
    },
    {
      id: '3',
      title: 'Saved Lists',
      icon: <MaterialCommunityIcons name="bookmark" size={24} color="#85360B" />,
      onPress: () => { }, // Define navigation
    },
    {
      id: '4',
      title: 'Address',
      icon: <MaterialCommunityIcons name="map-marker" size={24} color="#85360B" />,
      onPress: () => navigation.navigate('AddressList'),
    },
  ];

  const supportMenuItems = [
    {
      id: '5',
      title: 'Help & Support',
      icon: <MaterialCommunityIcons name="face-agent" size={24} color="#85360B" />,
      onPress: () => navigation.navigate('Support'),
    },
    {
      id: '6',
      title: 'About Us',
      icon: <MaterialCommunityIcons name="information-outline" size={24} color="#85360B" />,
      onPress: () => Linking.openURL('https://melocalapp.com/about/'),
    },
    {
      id: '7',
      title: 'Terms & Conditions',
      icon: <MaterialCommunityIcons name="file-document-outline" size={24} color="#85360B" />,
      onPress: () => Linking.openURL('https://melocalapp.com/terms/'),
    },
    {
      id: '8',
      title: 'Privacy Policy',
      icon: <MaterialCommunityIcons name="shield-check-outline" size={24} color="#85360B" />,
      onPress: () => Linking.openURL('https://melocalapp.com/privacypolicy/'),
    },
    {
      id: '9',
      title: 'Language',
      icon: <MaterialCommunityIcons name="translate" size={24} color="#85360B" />,
      onPress: () => { }, // Define navigation
    },
    {
      id: '10',
      title: 'Settings',
      icon: <Ionicons name="settings-sharp" size={24} color="#85360B" />,
      onPress: () => { }, // Define navigation
    },
    // Login/Logout appended to the bottom
    customerId
      ? {
        id: '11',
        title: 'Logout',
        icon: <Feather name="log-out" size={24} color="#85360B" />,
        onPress: () => setLogoutModalVisible(true),
      }
      : {
        id: '11',
        title: 'Login',
        icon: <MaterialCommunityIcons name="login" size={24} color="#85360B" />,
        onPress: () => navigation.navigate('Register1', { isFromCart: true }),
      },
  ];

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <LinearGradient
        colors={['#DF4F00', '#D14A00', '#6C2600']}
        style={[styles.headerGradient, { paddingTop: insets.top + 10 }]}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <View style={styles.profileInfo}>
            <Text style={styles.nameText}>{displayName}</Text>
            <Text style={styles.contactText}>
              {displayPhone} | {displayEmail}
            </Text>
            <TouchableOpacity
              style={styles.editProfileRow}
              onPress={() => navigation.navigate('UserProfileScreenLatest')}
            >
              <Text style={styles.editProfileText}>Edit Profile</Text>
              <Icon name="chevron-right" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.profileImageContainer}>
            <Image
              source={require('../daddy/tabassets/dummy-profile.png')} // Replace with proper avatar
              style={styles.profileImage}
            />
          </View>
        </View>
      </LinearGradient>

      {/* Menu Lists */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              // Handle any necessary refreshes here
              setRefreshing(false);
            }}
          />
        }
      >
        {/* General Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>General</Text>
          <View style={styles.cardBox}>
            {generalMenuItems.map((item, index) => {
              const isLast = index === generalMenuItems.length - 1;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.menuItem, isLast && styles.noBorderBottom]}
                  onPress={item.onPress}
                >
                  <View style={styles.menuItemLeft}>
                    {item.icon}
                    <Text style={styles.menuText}>{item.title}</Text>
                  </View>
                  <Icon name="chevron-right" size={24} color="#85360B" />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Help & Support Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Help & Support</Text>
          <View style={styles.cardBox}>
            {supportMenuItems.map((item, index) => {
              const isLast = index === supportMenuItems.length - 1;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.menuItem, isLast && styles.noBorderBottom]}
                  onPress={item.onPress}
                >
                  <View style={styles.menuItemLeft}>
                    {item.icon}
                    <Text style={styles.menuText}>{item.title}</Text>
                  </View>
                  <Icon name="chevron-right" size={24} color="#85360B" />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Version Check Row (Optional based on design, placed at bottom) */}
        <TouchableOpacity style={styles.versionContainer} onPress={handleCheckForUpdate}>
          <Text style={styles.versionText}>App Version: {appVersion || '1.0.0'} (Tap to check update)</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Modals */}
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
        message="Are you sure you want to logout?"
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
    backgroundColor: '#F2F2F2',
  },
  headerGradient: {
    paddingBottom: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  profileInfo: {
    flex: 1,
    paddingRight: 10,
  },
  nameText: {
    fontFamily: 'SF Pro Display',
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  contactText: {
    fontFamily: 'SF Pro Display',
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    marginTop: 4,
    opacity: 0.9,
  },
  editProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  editProfileText: {
    fontFamily: 'SF Pro Display',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginRight: 4,
  },
  profileImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 100 : 120, // Tab bar padding
    paddingHorizontal: 16,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'SF Pro Display',
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 12,
  },
  cardBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#85360B',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E6E6',
  },
  noBorderBottom: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuText: {
    fontFamily: 'SF Pro Display',
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginLeft: 16,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  versionText: {
    fontFamily: 'SF Pro Display',
    fontSize: 12,
    color: '#919191',
    fontWeight: '500',
  },
});

export default ProfileScreen;