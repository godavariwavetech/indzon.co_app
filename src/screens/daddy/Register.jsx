import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Pressable,
  Keyboard,
  ActivityIndicator,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  ScrollView,
  Platform
} from 'react-native';
import React, { useEffect, useState } from 'react';
import {
  responsiveHeight,
  responsiveWidth,
} from 'react-native-responsive-dimensions';
import { setInitial, verifyCustomerMobile } from '../../redux/reducers/auth';
import { useDispatch, useSelector } from 'react-redux';
import CustomModal from '../../components/CustomModal';
import commonStyles from '../../commonstyles/CommonStyles';

export default function Register({ navigation, route }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: '',
    message: ''
  });
  const dispatch = useDispatch();
  const loading = useSelector(state => state.Auth.loading);

  const showErrorModal = (title, message) => {
    setModalContent({ title, message });
    setModalVisible(true);
  };

  const validatePhoneNumber = () => {
    if (!phoneNumber) {
      showErrorModal('Validation Error', 'Phone number is required');
      return false;
    } else if (!/^[0-9]{10}$/.test(phoneNumber)) {
      showErrorModal('Validation Error', 'Please enter a valid 10-digit phone number');
      return false;
    }
    return true;
  };

  const handleRequestOTP = async () => {
    if (validatePhoneNumber()) {
      try {
        const response = await dispatch(verifyCustomerMobile({ customer_mobile_number: phoneNumber }));
        console.log("response of verifyCustomerMobile", response)
        if (response.payload && !response.error) {
          navigation.navigate(route.params?.isFromCart ? "OTPVerification1" : "OTPVerification", {
            phoneNumber: phoneNumber,
            otp: response.payload.loginotp,
            isFromCart: route.params?.isFromCart || null
          });
        } else {
          showErrorModal('API Error', 'Failed to send OTP. Please try again.');
        }
      } catch (error) {
        showErrorModal('Network Error', 'Failed to connect to the server. Please check your internet connection.');
      }
    }
  };

  useEffect(() => {
    dispatch(setInitial())
    if (route.params?.phone) {
      setPhoneNumber(route.params.phone);
    }
  }, [])

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <Pressable style={styles.container} onPress={() => Keyboard.dismiss()}>
        {/* Curved Wave Background Image */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >

      <ImageBackground
        source={require('./tabassets/amaraaTopbar.png')}
        style={styles.curvedWaveContainer}
        resizeMode="cover"
      />

           {/* Main Content with White Background */}
      <View style={styles.whiteContentSection}>
        {/* Logo Banner - Centered */}
        <View style={styles.brandingContainer}>
          <Image
            source={require('./tabassets/amaraaLogobanner.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Login Form Section */}
        <View style={styles.formSection}>
          <Text style={styles.loginTitle}>Login with your mobile number</Text>
          
          <Text style={styles.inputLabel}>Enter mobile number</Text>
          <View style={styles.phoneInputContainer}>
            <Text style={styles.countryCode}>+91</Text>
            <TextInput
              style={styles.phoneInput}
              placeholder="Enter mobile number"
              placeholderTextColor="#B0B0B0"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={(text) => setPhoneNumber(text)}
              maxLength={10}
              selectionColor={commonStyles.appMainColor}
            />
          </View>

          <TouchableOpacity onPress={handleRequestOTP} style={styles.continueButton}>
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>

          {!route.params?.isFromCart && (
            <TouchableOpacity
              onPress={() => navigation.replace('GuestApp')}
              style={styles.skipButton}
            >
              <Text style={styles.skipText}>Continue as Guest</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
        </ScrollView>

        {/* Modal and Loader */}
        <CustomModal
          visible={modalVisible}
          title={modalContent.title}
          message={modalContent.message}
          onConfirm={() => setModalVisible(false)}
          confirmText="OK"
          cancelText={null}
        />
        {loading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={commonStyles.appMainColor} />
          </View>
        )}
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // container: {
  //   flex: 1,
  //   backgroundColor: '#F6F6F6',
  // },
  // curvedWaveContainer: {
  //   // height: responsiveHeight(30),
  //   height:'200',
  //   width: '100%',
  // },
  // whiteContentSection: {
  //   flex: 1,
  //   backgroundColor: '#F6F6F6',
  //   paddingHorizontal: responsiveWidth(6),
  //   paddingTop: responsiveHeight(3),
  // },
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  curvedWaveContainer: {
    height: 200,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  whiteContentSection: {
    flex: 1,
    backgroundColor: '#F6F6F6',
    paddingHorizontal: responsiveWidth(6),
    paddingTop: responsiveHeight(3),
    paddingBottom: responsiveHeight(5), // Extra padding
  },
  brandingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: responsiveHeight(5),
    paddingHorizontal: responsiveWidth(5),
  },
  logoImage: {
    width: responsiveWidth(80),
    height: 120,
  },
  formSection: {
    paddingHorizontal: responsiveWidth(6),
    paddingVertical: responsiveHeight(3),
    backgroundColor:'#FFF',
    borderRadius:21
  },
  loginTitle: {
    fontSize: 17,
    fontWeight: '400',
    color: '#888',
    marginBottom: responsiveHeight(4),
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: '#DDD',
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginBottom: responsiveHeight(8),
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  countryCode: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginRight: 15,
    paddingRight: 15,
  },
  phoneInput: {
    flex: 1,
    fontSize: 17,
    color: '#000',
    padding: 0,
  },
  continueButton: {
    backgroundColor: commonStyles.appMainColor,
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: responsiveHeight(2),
    marginHorizontal: responsiveWidth(8),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
  },
  skipButton: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  skipText: {
    color: '#7B3F00',
    fontSize: 15,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  loaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    zIndex: 999,
  },
});
