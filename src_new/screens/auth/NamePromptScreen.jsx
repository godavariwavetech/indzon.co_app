import {appTheme} from '../../config/appTheme';
import {Text, TextInput} from '../../components/Typography';
import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useDispatch, useSelector} from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {
  getCustomerProfile,
  setCustomerName,
  updateCustomerProfile,
} from '../../redux/reducers/auth';
import {staticPersistor} from '../../redux/store';
import {setProfileName} from '../../redux/reducers/commerce';

// Shown once after login when the account has no name yet; continues to the location screen.
export default function NamePromptScreen({navigation}) {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const {customerId, mobileNumber} = useSelector(state => state.Auth);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(true);

  // The account may already have a name on the server (this device just forgot it): use it
  // instead of asking again.
  useEffect(() => {
    let active = true;
    dispatch(getCustomerProfile({customer_id: customerId}))
      .unwrap()
      .then(async data => {
        const profile = Array.isArray(data?.data) ? data.data[0] : null;
        const known = String(profile?.customer_name || '').trim();
        if (active && known) {
          dispatch(setCustomerName(known));
          dispatch(setProfileName(known));
          await staticPersistor.flush();
          navigation.reset({index: 0, routes: [{name: 'LocationSetup'}]});
          return;
        }
        if (active) {
          setChecking(false);
        }
      })
      .catch(() => active && setChecking(false));
    return () => {
      active = false;
    };
  }, [customerId, dispatch, navigation]);

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
      // keep the name through an app restart
      await staticPersistor.flush();
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

  if (checking) {
    return (
      <View style={[styles.screen, styles.checking]}>
        <ActivityIndicator color={appTheme.primary /* Original: "#3832FF" */} />
      </View>
    );
  }
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
          <View style={styles.notice} accessibilityRole="alert">
            <MaterialIcons name="info-outline" size={20} color={appTheme.primary /* Original: "#3832FF" */} />
            <Text style={styles.noticeText}>{error}</Text>
          </View>
        ) : null}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Continue"
        accessibilityState={{disabled: saving, busy: saving}}
        disabled={saving}
        onPress={save}
        style={({pressed}) => [
          styles.button,
          (pressed || saving) && styles.dimmed,
        ]}
        testID="setup-name-continue">
        <LinearGradient
          colors={[appTheme.primary /* Original: '#4B43FF' */, appTheme.primary /* Original: '#173CFF' */]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={styles.gradient}>
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </LinearGradient>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 20},
  checking: {alignItems: 'center', justifyContent: 'center'},
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
  notice: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: appTheme.tint /* Original: '#EEF0FF' */,
    borderWidth: 1,
    borderColor: appTheme.tintStrong /* Original: '#D6DAFF' */,
  },
  noticeText: {flex: 1, fontSize: 13, lineHeight: 18, color: appTheme.primaryDark /* Original: '#2A2F6B' */},
  button: {borderRadius: 11, overflow: 'hidden'},
  gradient: {
    minHeight: 46,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {fontSize: 14, fontWeight: '600', color: '#FFFFFF'},
  dimmed: {opacity: 0.65},
});
