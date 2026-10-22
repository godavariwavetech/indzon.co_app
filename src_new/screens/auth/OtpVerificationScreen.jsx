import {Text, TextInput} from '../../components/Typography';
import React, {useRef, useState} from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import {useDispatch} from 'react-redux';
import ShoppingLoginLayout from '../../components/auth/ShoppingLoginLayout';
import Svg, {Path} from 'react-native-svg';
import {DEFAULT_RESEND_SECONDS, OTP_LENGTH} from '../../config/authFlow';
import {useCountdown} from '../../hooks/useCountdown';
import {
  completeAuthentication,
  rememberStaticLogin,
} from '../../redux/reducers/auth';
import {staticPersistor} from '../../redux/store';
import {setProfileName} from '../../redux/reducers/commerce';
import {ENABLE_LIVE_DATA} from '../../config/appMode';
import authService from '../../services/authService';
import {sanitizeOtp} from '../../utils/phone';

export default function OtpVerificationScreen({navigation, route}) {
  const phoneNumber = route?.params?.phoneNumber || '';
  const dispatch = useDispatch();
  const inputRef = useRef(null);
  const busy = useRef(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(null);
  const [focused, setFocused] = useState(false);
  const [verified, setVerified] = useState(false);
  const {secondsLeft, restart} = useCountdown(
    route?.params?.resendAfterSeconds ?? DEFAULT_RESEND_SECONDS,
  );

  const submit = async () => {
    if (busy.current || verified) {
      return;
    }
    if (otp.length !== OTP_LENGTH) {
      setError(`Enter all ${OTP_LENGTH} digits of the verification code.`);
      inputRef.current?.focus();
      return;
    }
    busy.current = true;
    setPending('verify');
    setError('');
    try {
      // Static navigation only: do not create a server authentication session.
      if (!ENABLE_LIVE_DATA) {
        Keyboard.dismiss();
        dispatch(rememberStaticLogin(phoneNumber));
        // The navigator switches to location setup when this flag changes.
        await staticPersistor.flush();
        return;
      }
      const session = await authService.verifyOtp(phoneNumber, otp);
      setVerified(true);
      dispatch(completeAuthentication(session));
      if (session.customerName) {
        dispatch(setProfileName(session.customerName));
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Could not verify OTP. Please try again.',
      );
      setOtp('');
      inputRef.current?.focus();
    } finally {
      busy.current = false;
      setPending(null);
    }
  };

  const resend = async () => {
    if (busy.current || verified || secondsLeft > 0) {
      return;
    }
    busy.current = true;
    setPending('resend');
    setError('');
    try {
      const response = !ENABLE_LIVE_DATA
        ? {resendAfterSeconds: DEFAULT_RESEND_SECONDS}
        : await authService.requestOtp(phoneNumber);
      restart(response.resendAfterSeconds);
      setOtp('');
      inputRef.current?.focus();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Could not resend OTP. Please try again.',
      );
    } finally {
      busy.current = false;
      setPending(null);
    }
  };

  const backToLogin = () => {
    if (pending || verified) {
      return;
    }
    Keyboard.dismiss();
    if (navigation.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation.replace('Login', {phoneNumber});
    }
  };

  return (
    <ShoppingLoginLayout navigation={navigation}>
      <View style={styles.header}>
        <Pressable
          onPress={backToLogin}
          disabled={Boolean(pending) || verified}
          accessibilityRole="button"
          accessibilityLabel="Back to login"
          style={styles.back}
          testID="otp-back">
          <Svg width={24} height={24} viewBox="0 0 24 24">
            <Path
              d="M20 12H4m8-8-8 8 8 8"
              fill="none"
              stroke="#202427"
              strokeWidth={1.7}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Pressable>
        <Text style={styles.title} accessibilityRole="header">
          OTP Verification
        </Text>
      </View>
      <View style={styles.form}>
        <Text style={styles.subtitle}>
          {!ENABLE_LIVE_DATA
            ? `Enter any ${OTP_LENGTH}-digit code to continue with`
            : verified
            ? 'Your phone number has been verified.'
            : 'We Have Sent a verification code to'}
        </Text>
        <Text style={styles.phoneNumber} testID="otp-phone-number">
          +91 {phoneNumber}
        </Text>
        {!verified ? (
          <>
            <Pressable
              onPress={() => inputRef.current?.focus()}
              accessible={false}
              style={styles.boxes}>
              {Array.from({length: OTP_LENGTH}, (_, index) => (
                <View
                  key={index}
                  accessible={false}
                  style={[
                    styles.box,
                    focused &&
                      index === Math.min(otp.length, OTP_LENGTH - 1) &&
                      styles.activeBox,
                    error && styles.invalidBox,
                  ]}>
                  <Text style={styles.digit}>{otp[index] || ''}</Text>
                </View>
              ))}
              <TextInput
                ref={inputRef}
                value={otp}
                onChangeText={value => {
                  setOtp(sanitizeOtp(value, OTP_LENGTH));
                  setError('');
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
                maxLength={OTP_LENGTH}
                autoFocus
                caretHidden
                editable={!pending}
                returnKeyType="done"
                onSubmitEditing={submit}
                accessibilityLabel="Verification code"
                style={styles.hiddenInput}
                testID="otp-input"
              />
            </Pressable>
            {error ? (
              <Text
                style={styles.error}
                accessibilityRole="alert"
                accessibilityLiveRegion="polite">
                {error}
              </Text>
            ) : null}
            <Pressable
              onPress={resend}
              disabled={secondsLeft > 0 || Boolean(pending)}
              accessibilityRole="button"
              accessibilityState={{
                disabled: secondsLeft > 0 || Boolean(pending),
              }}
              hitSlop={8}
              style={styles.resend}
              testID="otp-resend">
              <Text
                style={[
                  styles.resendText,
                  (secondsLeft > 0 || pending) && styles.muted,
                ]}>
                {pending === 'resend'
                  ? 'Sending OTP…'
                  : secondsLeft > 0
                  ? `Resend OTP in ${secondsLeft}`
                  : 'Resend OTP'}
              </Text>
            </Pressable>
          </>
        ) : null}
        <Pressable
          onPress={submit}
          disabled={verified || Boolean(pending)}
          accessibilityRole="button"
          accessibilityLabel={verified ? 'Verified' : 'Continue'}
          accessibilityState={{
            disabled: verified || Boolean(pending),
            busy: pending === 'verify',
          }}
          style={({pressed}) => [
            styles.button,
            (pressed || pending || verified) && styles.dimmed,
          ]}
          testID="otp-continue">
          {pending === 'verify' ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>
              {verified ? 'Verified' : 'Continue'}
            </Text>
          )}
        </Pressable>
      </View>
    </ShoppingLoginLayout>
  );
}

const styles = StyleSheet.create({
  header: {height: 48, alignItems: 'center', justifyContent: 'center'},
  back: {
    position: 'absolute',
    left: -8,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {width: '100%', alignItems: 'center', paddingTop: 14},
  title: {
    color: '#080808',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
    textAlign: 'center',
  },
  subtitle: {
    color: '#606060',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  phoneNumber: {
    color: '#080808',
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },
  boxes: {flexDirection: 'row', gap: 8, marginTop: 28, alignSelf: 'center'},
  box: {
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8D8DE',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBox: {borderColor: '#878787'},
  invalidBox: {borderColor: '#C62828'},
  digit: {color: '#080808', fontSize: 20},
  hiddenInput: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.03,
    color: 'transparent',
    fontSize: 1,
  },
  error: {
    color: '#C62828',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 12,
    textAlign: 'center',
  },
  resend: {alignSelf: 'center', marginTop: 24, padding: 4},
  resendText: {color: '#3832FF', fontSize: 16, lineHeight: 22},
  muted: {color: '#606060'},
  button: {
    width: '76%',
    minHeight: 48,
    backgroundColor: '#3832FF',
    borderWidth: 1,
    borderColor: '#D5D5DE',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  dimmed: {opacity: 0.65},
});
