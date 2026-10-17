import {Text, TextInput} from '../../components/Typography';
import React, {useRef, useState} from 'react';
import {ActivityIndicator, Pressable, StyleSheet, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, {Path} from 'react-native-svg';
import ShoppingLoginLayout from '../../components/auth/ShoppingLoginLayout';
import authService from '../../services/authService';
import {ENABLE_LIVE_DATA} from '../../config/appMode';
import {DEFAULT_RESEND_SECONDS} from '../../config/authFlow';
import {isValidPhoneNumber, sanitizePhoneNumber} from '../../utils/phone';

export default function LoginScreen({navigation, route}) {
  const [phoneNumber, setPhoneNumber] = useState(
    sanitizePhoneNumber(route?.params?.phoneNumber || ''),
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const busy = useRef(false);
  const inputRef = useRef(null);

  const submit = async () => {
    if (busy.current) {
      return;
    }
    if (!isValidPhoneNumber(phoneNumber)) {
      setError('Enter a valid 10-digit mobile number.');
      inputRef.current?.focus();
      return;
    }
    busy.current = true;
    setLoading(true);
    setError('');
    try {
      // OTP requests are disabled while the UI uses static data.
      const response = !ENABLE_LIVE_DATA
        ? {resendAfterSeconds: DEFAULT_RESEND_SECONDS}
        : await authService.requestOtp(phoneNumber);
      navigation.navigate('OtpVerification', {phoneNumber, ...response});
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Could not send OTP. Please try again.',
      );
    } finally {
      busy.current = false;
      setLoading(false);
    }
  };

  return (
    <ShoppingLoginLayout navigation={navigation}>
      <Text style={styles.title} accessibilityRole="header">
        Login
      </Text>
      <Text style={styles.subtitle}>Login with your mobile number</Text>
      <View style={styles.form}>
        <View style={[styles.phoneField, error && styles.invalid]}>
          <Text style={styles.countryCode}>+91</Text>
          <TextInput
            ref={inputRef}
            value={phoneNumber}
            onChangeText={value => {
              setPhoneNumber(sanitizePhoneNumber(value));
              setError('');
            }}
            placeholder="Enter phone number"
            placeholderTextColor="#7C89A5"
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            autoComplete="tel"
            // Allow the complete autofill value through before normalizing it.
            maxLength={30}
            editable={!loading}
            returnKeyType="done"
            onSubmitEditing={submit}
            selectionColor="#243FFF"
            accessibilityLabel="Phone Number"
            style={styles.input}
            testID="login-phone-input"
          />
        </View>
        {error ? (
          <Text
            style={styles.error}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Continue"
        accessibilityState={{disabled: loading, busy: loading}}
        disabled={loading}
        onPress={submit}
        style={({pressed}) => [
          styles.button,
          (pressed || loading) && styles.dimmed,
        ]}
        testID="login-request-otp">
        <LinearGradient
          colors={['#4B43FF', '#173CFF']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={styles.gradient}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.buttonText}>Continue</Text>
              <Svg width={18} height={18} viewBox="0 0 24 24">
                <Path
                  d="M4 12h16m-6-6 6 6-6 6"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </>
          )}
        </LinearGradient>
      </Pressable>
    </ShoppingLoginLayout>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '700',
    color: '#050A36',
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 19,
    color: '#536892',
    marginTop: 8,
  },
  form: {marginTop: 18},
  phoneField: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#DFE6F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  countryCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#050A36',
    paddingRight: 10,
  },
  input: {
    flex: 1,
    minHeight: 50,
    paddingVertical: 10,
    fontSize: 14,
    color: '#050A36',
  },
  invalid: {borderColor: '#C62828'},
  error: {color: '#C62828', fontSize: 12, lineHeight: 18, marginTop: 8},
  button: {marginTop: 20, borderRadius: 11, overflow: 'hidden'},
  gradient: {
    minHeight: 46,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonText: {fontSize: 14, fontWeight: '600', color: '#FFFFFF'},
  dimmed: {opacity: 0.65},
});
