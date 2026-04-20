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

const UserProfileScreenLatest = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  // Get user data from Redux
  const { mobileNumber } = useSelector(state => state.Auth);
  const { selectedAddress } = useSelector(state => state.address);
  const { addressList } = useSelector(state => state.Dashboard);

  const addressData = selectedAddress || (addressList && addressList.length > 0 ? addressList[0] : null);

  // Form state
  const [name, setName] = useState('');
  const [image, setImage] = useState(null);
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    name: '',
    mobile: '',
  });

  // Initialize form with existing data
  useEffect(() => {
    if (addressData) {
      setName(addressData.customer_name || '');
      setMobile(addressData.customer_mobile_number || mobileNumber || '');
      setEmail(addressData.email || '');
    }
  }, [addressData, mobileNumber]);

  const handleUpdateProfile = async () => {
     if (!validate()) return
 
    try {
      setIsLoading(true);
       const payload = {
      name,
      mobile,
      email,
      imageBase64: image?.base64 || null,
      imageType: image?.type || null,
      fileName: image?.fileName || null,
    };

    console.log('Submitted Data:', payload);

      // TODO: Dispatch update profile action
      // await dispatch(updateProfile({ name, mobile, email }));
      // Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const pickImageFromGallery = () => {
    launchImageLibrary({ mediaType: 'photo',includeBase64: true }, response => {
      if (!response.didCancel && !response.errorCode) {
        const asset = response.assets[0];
        setImage(asset);
      }
    });
  };

  const pickImageFromCamera = () => {
    launchCamera({ mediaType: 'photo', includeBase64: true }, response => {
      if (!response.didCancel && !response.errorCode) {
        const asset = response.assets[0];
        setImage(asset);
      }
    });
  };

  const handleImagePick = () => {
    Alert.alert(
      'Upload Profile Picture',
      'Choose an option',
      [
        { text: 'Camera', onPress: pickImageFromCamera },
        { text: 'Gallery', onPress: pickImageFromGallery },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const validate = () => {
    let valid = true;
    let tempErrors = { name: '', mobile: '' };

    if (!name.trim()) {
      tempErrors.name = 'Name is required';
      valid = false;
    }

    if (!mobile.trim()) {
      tempErrors.mobile = 'Mobile number is required';
      valid = false;
    } else if (!/^[6-9]\d{9}$/.test(mobile)) {
      tempErrors.mobile = 'Enter valid 10-digit mobile number';
      valid = false;
    }

    setErrors(tempErrors);
    return valid;
  };

  return (
    <View style={styles.container}>
      {/* Header - Orange/Red background */}
      <LinearGradient colors={['#DF4F00', '#D14A00', '#6C2600']} style={[styles.headerContainer, { paddingTop: insets.top }]} >
        {/* <View style={[styles.headerContainer, { paddingTop: insets.top }]}> */}
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
        {/* <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>
              {name ? name.charAt(0).toUpperCase() : 'N'}
            </Text>
          </View>
        </View> */}
        <TouchableOpacity onPress={handleImagePick} style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            {image ? (
              <Image source={{ uri: image.uri }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarLetter}>
                {name ? name.charAt(0).toUpperCase() : 'N'}
              </Text>
            )}
          </View>
        </TouchableOpacity>
        {/* </View> */}
      </LinearGradient>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* White Card Container */}
        <View style={styles.profileCard}>
          {/* Top spacing for avatar */}
          <View style={styles.topSpacer} />

          {/* User Info Section */}
          <Text style={styles.displayName}>{name || 'Nithin'}</Text>
          <Text style={styles.displayContact}>
            {mobile ? `+91 ${mobile}` : '+91 9965841257'} | {email || 'Nithin@gmail.com'}
          </Text>

          {/* Edit Profile Button */}
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
            <AntDesign name="right" size={12} color="#888" />
          </TouchableOpacity>

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
                style={styles.inputField}
                value={mobile}
                onChangeText={setMobile}
                placeholder="Enter Your Mobile"
                placeholderTextColor="#CCC"
                keyboardType="phone-pad"
                maxLength={10}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerContainer: {
    // backgroundColor: '#D84315',
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
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: responsiveHeight(0.5),
    marginBottom: responsiveHeight(2.5),
  },
  editButtonText: {
    fontSize: responsiveFontSize(1.8),
    color: '#888',
    marginRight: 5,
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
    // elevation: 4,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.25,
    // shadowRadius: 4,
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
  borderRadius: responsiveWidth(17.5),
},
});

export default UserProfileScreenLatest;
