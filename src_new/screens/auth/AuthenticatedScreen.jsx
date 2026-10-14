import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import AuthScreenLayout from '../../components/auth/AuthScreenLayout';
import AuthButton from '../../components/auth/AuthButton';
import {authFlowColors as colors} from '../../config/authFlow';
import {actionLogout} from '../../redux/reducers/auth';
import {maskPhoneNumber} from '../../utils/phone';

// The new app can replace this auth completion route with its home routes.
export default function AuthenticatedScreen() {
  const dispatch = useDispatch();
  const phoneNumber = useSelector(state => state.Auth.mobileNumber);
  return (
    <AuthScreenLayout>
      <Text accessibilityRole="header" style={styles.title}>
        You're signed in
      </Text>
      <Text style={styles.subtitle}>
        Your phone number {maskPhoneNumber(phoneNumber || '')} has been
        verified.
      </Text>
      <View style={styles.spacer} />
      <AuthButton
        label="Sign out"
        onPress={() => dispatch(actionLogout())}
        testID="auth-sign-out"
      />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 12,
  },
  spacer: {flexGrow: 1, minHeight: 40},
});
