import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize,
} from 'react-native-responsive-dimensions';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import commonStyles from '../../commonstyles/CommonStyles';
import LinearGradient from 'react-native-linear-gradient';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
// Import the new getCustomerProfile thunk
import { updateCustomerProfile, getCustomerProfile } from '../../redux/reducers/auth';

const UserProfileScreenLatest = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  // Get user data from Redux
  const { mobileNumber, customerId, profileData } = useSelector(state => state.Auth);

  // Form state
  const [name, setName] = useState('');
  const [image, setImage] = useState(null); // Local picked image
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [errors, setErrors] = useState({
    name: '',
    mobile: '',
    email: '',
  });

  // Fetch Profile Data on Mount
  useEffect(() => {
    if (customerId) {
      setIsFetching(true);
      dispatch(getCustomerProfile({ customer_id: customerId })).finally(() => {
        setIsFetching(false);
      });
    }
  }, [dispatch, customerId]);

  // Initialize form with existing data from the profileData response
  useEffect(() => {
    if (profileData) {
      setName(profileData.customer_name || '');
      setMobile(profileData.customer_mobile_number || mobileNumber || '');
      setEmail(profileData.customer_email || '');
    }
  }, [profileData, mobileNumber]);

  const handleUpdateProfile = async () => {
    if (!validate()) return;

    try {
      setIsLoading(true);

      const imageEvent = image && image.base64 ? 1 : 0;
      
      const payload = {
        customer_id: customerId,
        customer_name: name,
        customer_mobile_number: mobile,
        customer_email: email,
        imageevent: imageEvent,
        image: imageEvent === 1 ? `data:image/png;base64,${image.base64}` : '',
        previous_image: profileData?.profile_image || '',
      };

      const resultAction = await dispatch(updateCustomerProfile(payload));

      if (updateCustomerProfile.fulfilled.match(resultAction)) {
        if (resultAction.payload?.status === 200) {
          Alert.alert('Success', 'Profile updated successfully');
          // Refresh profile data to reflect changes
          dispatch(getCustomerProfile({ customer_id: customerId }));
          navigation.goBack();
        } else {
          Alert.alert('Error', resultAction.payload?.message || 'Failed to update profile');
        }
      } else {
        Alert.alert('Error', resultAction.payload || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const pickImageFromGallery = () => {
    setIsImageModalVisible(false);
    launchImageLibrary({ mediaType: 'photo', includeBase64: true }, response => {
      if (!response.didCancel && !response.errorCode && response.assets?.length > 0) {
        setImage(response.assets[0]);
      }
    });
  };

  const pickImageFromCamera = () => {
    setIsImageModalVisible(false);
    launchCamera({ mediaType: 'photo', includeBase64: true }, response => {
      if (!response.didCancel && !response.errorCode && response.assets?.length > 0) {
        setImage(response.assets[0]);
      }
    });
  };

  const handleImagePick = () => {
    setIsImageModalVisible(true);
  };

  const validate = () => {
    let valid = true;
    let tempErrors = { name: '', mobile: '', email: '' };

    if (!name.trim()) {
      tempErrors.name = 'Name is required';
      valid = false;
    } else if (!/^[a-zA-Z\s]{2,50}$/.test(name.trim())) {
      tempErrors.name = 'Enter a valid name (letters only, min 2 chars)';
      valid = false;
    }

    if (!mobile.trim()) {
      tempErrors.mobile = 'Mobile number is required';
      valid = false;
    } else if (!/^[6-9]\d{9}$/.test(mobile)) {
      tempErrors.mobile = 'Enter valid 10-digit mobile number';
      valid = false;
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      tempErrors.email = 'Enter a valid email address';
      valid = false;
    }

    setErrors(tempErrors);
    return valid;
  };

  return (
    <View style={styles.container}>
      {/* Header - Orange/Red background */}
      <LinearGradient colors={['#DF4F00', '#D14A00', '#6C2600']} style={[styles.headerContainer, { paddingTop: insets.top }]} >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <AntDesign name="arrowleft" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Account</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Avatar positioned on top of header */}
        <TouchableOpacity onPress={handleImagePick} style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            {image ? (
              <Image source={{ uri: image.uri }} style={styles.avatarImage} />
            ) : profileData?.profile_image ? (
              <Image source={{ uri: profileData.profile_image }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarLetter}>
                {name ? name.charAt(0).toUpperCase() : 'N'}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </LinearGradient>

      {isFetching ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#D14A00" />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>

          {/* White Card Container */}
          <View style={styles.profileCard}>
            {/* Top spacing for avatar */}
            <View style={styles.topSpacer} />

            {/* User Info Section */}
            <Text style={styles.displayName}>{name || 'Guest'}</Text>
            <Text style={styles.displayContact}>
              {mobile ? `+91 ${mobile}` : 'No Mobile'} | {email || 'No Email'}
            </Text>

            {/* Form Fields */}
            <View style={styles.formFields}>
              {/* Name Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.inputField}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter Your Name"
                  placeholderTextColor="#CCC"
                />
                {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
              </View>

              {/* Mobile Number Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mobile Number</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: '#F0F0F0' }]}
                  value={mobile}
                  onChangeText={setMobile}
                  placeholder="Enter Your Mobile"
                  placeholderTextColor="#CCC"
                  keyboardType="phone-pad"
                  maxLength={10}
                  editable={false}
                />
                {errors.mobile ? <Text style={styles.errorText}>{errors.mobile}</Text> : null}
              </View>

              {/* Email Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.inputField}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter Your Email"
                  placeholderTextColor="#CCC"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
              </View>
            </View>
          </View>

          {/* Update Profile Button - Outside card */}
          <TouchableOpacity
            style={styles.updateProfileButton}
            onPress={handleUpdateProfile}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.updateProfileButtonText}>Update Profile</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Image Selection Modal */}
      <Modal
        visible={isImageModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsImageModalVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsImageModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Upload Profile Picture</Text>
            <View style={styles.modalOptions}>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={pickImageFromCamera}>
                <View style={[styles.iconCircle, { backgroundColor: '#E3F2FD' }]}>
                  <AntDesign name="camerao" size={24} color="#2196F3" />
                </View>
                <Text style={styles.modalOptionText}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalOption}
                onPress={pickImageFromGallery}>
                <View style={[styles.iconCircle, { backgroundColor: '#F1F8E9' }]}>
                  <AntDesign name="picture" size={24} color="#4CAF50" />
                </View>
                <Text style={styles.modalOptionText}>Gallery</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setIsImageModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    paddingBottom: responsiveHeight(15),
    position: 'relative',
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: responsiveHeight(1.5),
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: responsiveFontSize(2.4),
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginLeft: -40,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
    marginTop: -responsiveHeight(8),
  },
  scrollContent: {
    paddingBottom: responsiveHeight(5),
  },
  avatarSection: {
    position: 'absolute',
    bottom: -responsiveHeight(1.3),
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  avatarCircle: {
    width: responsiveWidth(35),
    height: responsiveWidth(35),
    borderRadius: responsiveWidth(17.5),
    backgroundColor: '#FF8A65',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: '#fff',
    overflow: 'hidden',
  },
  avatarLetter: {
    fontSize: responsiveFontSize(8),
    fontWeight: '700',
    color: '#fff',
  },
  profileCard: {
    backgroundColor: '#fff',
    marginHorizontal: responsiveWidth(4),
    borderRadius: 24,
    paddingHorizontal: responsiveWidth(6),
    paddingBottom: responsiveHeight(3),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  topSpacer: {
    height: responsiveHeight(10),
  },
  displayName: {
    fontSize: responsiveFontSize(3),
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: responsiveHeight(0.5),
  },
  displayContact: {
    fontSize: responsiveFontSize(1.7),
    color: '#666',
    textAlign: 'center',
    marginBottom: responsiveHeight(0.8),
  },
  formFields: {
    marginTop: responsiveHeight(0.5),
  },
  inputGroup: {
    marginBottom: responsiveHeight(2.5),
  },
  label: {
    fontSize: responsiveFontSize(1.9),
    color: '#666',
    marginBottom: responsiveHeight(1),
    fontWeight: '400',
  },
  inputField: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: responsiveHeight(1.8),
    fontSize: responsiveFontSize(1.9),
    color: '#000',
  },
  updateProfileButton: {
    backgroundColor: '#8B4513',
    marginHorizontal: responsiveWidth(8),
    marginTop: responsiveHeight(4),
    paddingVertical: responsiveHeight(1.5),
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateProfileButtonText: {
    color: '#fff',
    fontSize: responsiveFontSize(2.2),
    fontWeight: '700',
  },
  errorText: {
    color: 'red',
    fontSize: responsiveFontSize(1.6),
    marginTop: 4,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: responsiveWidth(6),
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: responsiveFontSize(2.2),
    fontWeight: '700',
    color: '#333',
    marginBottom: responsiveHeight(3),
  },
  modalOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: responsiveHeight(3),
  },
  modalOption: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsiveHeight(1),
  },
  modalOptionText: {
    fontSize: responsiveFontSize(1.8),
    color: '#555',
    fontWeight: '500',
  },
  cancelButton: {
    marginTop: responsiveHeight(1),
    paddingVertical: responsiveHeight(1.5),
    width: '100%',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  cancelButtonText: {
    fontSize: responsiveFontSize(2),
    color: '#FF3B30',
    fontWeight: '600',
  },
});

export default UserProfileScreenLatest;