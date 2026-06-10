import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Pressable,
  Keyboard,
  ActivityIndicator,
  Alert,
  Linking,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  ScrollView
} from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  responsiveHeight,
  responsiveWidth,
} from 'react-native-responsive-dimensions';
import { useDispatch } from 'react-redux';
import { actionLogin, addCustomer, verifyCustomerMobile } from '../../redux/reducers/auth';
import Geolocation from 'react-native-geolocation-service';
import { checkAddressExistence } from '../../redux/reducers/daddy';
import commonStyles from '../../commonstyles/CommonStyles';

export default function OTPVerification({ navigation, route }) {
  const dispatch = useDispatch();
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(60);
  const inputRefs = useRef([]);
  const [error, setError] = useState('');
  const [loader, setLoader] = useState(false);
  const [location, setLocation] = useState(null);
  const [paramOtp, setParamOtp] = useState(route.params?.otp || "")

  useEffect(() => {
    const countdown = setInterval(() => {
      if (timer > 0) {
        setTimer(timer - 1);
      } else {
        clearInterval(countdown);
      }
    }, 1000);
    return () => clearInterval(countdown);
  }, [timer]);

  const handleVerifyOtp = async () => {
    if (otp.includes('')) {
      setError('Please enter all 4 digits of the OTP');
      return;
    }

    try {
      const enteredOtp = otp.join('');
      setLoader(true);

      if (paramOtp == enteredOtp) {
        const response = await dispatch(addCustomer({ mobileNumber: route.params?.phoneNumber, otp: enteredOtp }))
        route.params?.isFromCart ? navigation.pop(2) : dispatch(actionLogin())
      } else {
        setError('Please enter valid OTP');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoader(false);
    }
  };

  const handleOTPChange = (value, index) => {
    let newOtp = [...otp];

    // Only allow paste in first box
    if (index === 0 && value.length === otp.length) {
      newOtp = value.split('');
      setOtp(newOtp);
      inputRefs.current[otp.length - 1]?.focus();
      setError('');
      return;
    }

    // Normal single character entry
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Move forward
    if (value && index < otp.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Move backward if cleared
    if (!value && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const maskPhoneNumber = number => {
    if (!number) return '';
    return number.replace(/(\d{2})\d{6}(\d{2})/, '$1*****$2');
  };

  const resendOtpHandler = async () => {
    setError("")
    setTimer(60);
    setOtp(['', '', '', '']);
    const response = await dispatch(verifyCustomerMobile({ customer_mobile_number: route.params?.phoneNumber }));
    setParamOtp(response.payload.loginotp)
  };

  return (
    <Pressable style={styles.container} onPress={() => Keyboard.dismiss()}>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20} // Adjust if needed
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Curved Wave Background Image */}
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

            {/* OTP Verification Form Section */}
            <View style={styles.formSection}>
              <Text style={styles.subtitle}>
                We Have Sent a verification code to
              </Text>
              <Text style={styles.verificationTitle}>{maskPhoneNumber(` ${route.params?.phoneNumber}`)}</Text>
              {/* <Text style={styles.verificationTitle}>Verification</Text> */}
              {/* <Text style={styles.subtitle}>
            Enter the verification code we just sent on the mobile number {maskPhoneNumber(` ${route.params?.phoneNumber}`)}
          </Text> */}

              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={el => (inputRefs.current[index] = el)}
                    style={styles.otpBox}
                    keyboardType="numeric"
                    maxLength={index === 0 ? otp.length : 1}
                    value={digit}
                    onChangeText={value => handleOTPChange(value, index)}
                    onKeyPress={({ nativeEvent }) => {
                      if (nativeEvent.key === 'Backspace' && !digit && index > 0) {
                        inputRefs.current[index - 1]?.focus();
                      }
                    }}
                    selectionColor={commonStyles.appMainColor}
                  />
                ))}
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={styles.resendContainer}>
                {timer !== 0 ? (
                  <Text style={styles.timerText}>Resend OTP in {timer}s</Text>
                ) : (
                  <TouchableOpacity onPress={resendOtpHandler}>
                    <Text style={[styles.resendText, { color: timer == 0 ? '#7B3F00' : '#8F8F8F' }]}>
                      Resend OTP
                    </Text>
                  </TouchableOpacity>
                )
                }
              </View>

              <TouchableOpacity onPress={handleVerifyOtp} style={styles.verifyButton}>
                {loader ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.verifyButtonText}>Verify</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
 container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
  },
  curvedWaveContainer: {
    height: 200,
    width: '100%',
  },
  
  scrollContent: {
    flexGrow: 1,           // Important for ScrollView
    paddingBottom: 50,     // Extra space when keyboard opens
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
    marginBottom: responsiveHeight(4),
    paddingHorizontal: responsiveWidth(5),
  },
  logoImage: {
    width: responsiveWidth(70),
    height: 120,
  },
  formSection: {
    paddingHorizontal: responsiveWidth(4),
    paddingTop: responsiveHeight(1),
    backgroundColor: '#FFF',
    borderRadius: 21,
    paddingBottom: responsiveHeight(3),
  },
  verificationTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#666',
    marginBottom: responsiveHeight(1),
    lineHeight: 22,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: responsiveHeight(2),
    marginBottom: responsiveHeight(2),
    gap: 12,
  },
  otpBox: {
    width: 55,
    height: 55,
    borderWidth: 1.5,
    borderRadius: 12,
    borderColor: '#DDD',
    backgroundColor: '#FFF',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  resendContainer: {
    marginTop: responsiveHeight(3),
    alignItems: 'center',
  },
  timerText: {
    color: '#3D3D3D',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  resendText: {
    fontSize: 15,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  verifyButton: {
    backgroundColor: commonStyles.appMainColor,
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: responsiveHeight(4),
    marginHorizontal: responsiveWidth(8),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  verifyButtonText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
  },
});
