import {Text, TextInput} from '../../components/Typography';
import React, {useState} from 'react';
import {KeyboardAvoidingView, Platform, StatusBar, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useDispatch, useSelector} from 'react-redux';
import AuthButton from '../../components/auth/AuthButton';
import {
  setCustomerName,
  updateCustomerProfile,
} from '../../redux/reducers/auth';
import {setProfileName} from '../../redux/reducers/commerce';

// Shown once after login when the account has no name yet; continues to the location screen.
export default function NamePromptScreen({navigation}) {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const {customerId, mobileNumber} = useSelector(state => state.Auth);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError('Enter your name to continue.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await dispatch(
        updateCustomerProfile({
          customer_id: customerId,
          customer_name: trimmed,
          customer_mobile_number: mobileNumber || '',
          customer_email: '',
          imageevent: 0,
          previous_image: '',
        }),
      ).unwrap();
      dispatch(setCustomerName(trimmed));
      dispatch(setProfileName(trimmed));
      navigation.reset({index: 0, routes: [{name: 'LocationSetup'}]});
    } catch (err) {
      setError(
        typeof err === 'string'
          ? err
          : err?.message || 'Could not save your name. Please try again.',
      );
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[
        styles.screen,
        {paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16},
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <View style={styles.body}>
        <Text style={styles.title} accessibilityRole="header">
          What should we call you?
        </Text>
        <Text style={styles.subtitle}>
          Add your name so your orders and deliveries are addressed to you.
        </Text>
        <TextInput
          value={name}
          onChangeText={value => {
            setName(value);
            setError('');
          }}
          placeholder="Your name"
          autoCapitalize="words"
          autoFocus
          maxLength={60}
          returnKeyType="done"
          onSubmitEditing={save}
          style={styles.input}
          accessibilityLabel="Your name"
          testID="setup-name"
        />
        {error ? (
          <Text style={styles.error} accessibilityRole="alert">
            {error}
          </Text>
        ) : null}
      </View>
      <AuthButton
        label="Continue"
        onPress={save}
        loading={saving}
        testID="setup-name-continue"
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 20},
  body: {flex: 1},
  title: {fontSize: 26, lineHeight: 32, fontWeight: '700', color: '#0B0B0B'},
  subtitle: {fontSize: 15, lineHeight: 22, color: '#6B7280', marginTop: 8},
  input: {
    marginTop: 24,
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#202427',
    backgroundColor: '#F9F9F9',
  },
  error: {marginTop: 10, fontSize: 13, color: '#C62828'},
});
