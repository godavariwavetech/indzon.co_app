import React, {useCallback, useEffect, useState} from 'react';
import {
  Alert,
  AppState,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import {Text} from '../ReadableText';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {
  check,
  checkNotifications,
  openSettings,
  PERMISSIONS,
  request,
  requestNotifications,
  RESULTS,
} from 'react-native-permissions';
import {STATIC_APP_FLOW} from '../../config/appMode';

const locationPermission =
  Platform.OS === 'ios'
    ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
    : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
const allowed = status => [RESULTS.GRANTED, RESULTS.LIMITED].includes(status);

export default function SettingsModal({visible, onClose, onLogout, onDelete}) {
  const insets = useSafeAreaInsets();
  const [location, setLocation] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    try {
      const [gps, notices, alternate] = await Promise.all([
        check(locationPermission),
        checkNotifications(),
        check(
          Platform.OS === 'android'
            ? PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION
            : PERMISSIONS.IOS.LOCATION_ALWAYS,
        ),
      ]);
      setLocation(allowed(gps) || allowed(alternate));
      setNotifications(allowed(notices.status));
      setError('');
      setReady(true);
    } catch {
      setReady(false);
      setError('Could not read permissions. Close settings and try again.');
    }
  }, []);
  useEffect(() => {
    if (!visible) {
      return undefined;
    }
    setReady(false);
    refresh();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        refresh();
      }
    });
    return () => subscription.remove();
  }, [visible, refresh]);

  const toggle = async kind => {
    setBusy(true);
    try {
      const enabled = kind === 'location' ? location : notifications;
      if (enabled) {
        // OS permissions can only be revoked in device settings.
        await openSettings(
          kind === 'notifications' ? 'notifications' : 'application',
        );
      } else {
        const status =
          kind === 'location'
            ? await request(locationPermission)
            : (await requestNotifications(['alert', 'sound', 'badge'])).status;
        if (status === RESULTS.BLOCKED) {
          await openSettings('application');
        }
      }
      await refresh();
    } catch {
      Alert.alert(
        'Settings unavailable',
        'Please update permissions in your device settings.',
      );
    } finally {
      setBusy(false);
    }
  };
  const confirmAction = deleting => {
    Alert.alert(
      deleting ? 'Delete account?' : 'Log out of INDZON?',
      deleting
        ? STATIC_APP_FLOW
          ? 'This removes your profile, saved addresses, cart and wishlist from this device.'
          : 'Your account will be deleted. This action cannot be undone.'
        : 'You can sign in again from the login screen.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: deleting ? 'Delete account' : 'Log out',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              await (deleting ? onDelete() : onLogout());
            } catch {
              Alert.alert('Unable to complete action', 'Please try again.');
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  };
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={busy ? undefined : onClose}>
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close settings"
          style={StyleSheet.absoluteFillObject}
          onPress={onClose}
          disabled={busy}
        />
        <View
          style={[styles.card, {paddingBottom: Math.max(insets.bottom, 16)}]}
          accessibilityViewIsModal
          accessibilityLabel="Settings">
          {[
            {
              key: 'location',
              label: 'Location',
              icon: 'location-on',
              value: location,
            },
            {
              key: 'notifications',
              label: 'Notifications',
              icon: 'notifications',
              value: notifications,
            },
          ].map(item => (
            <Pressable
              key={item.key}
              style={styles.row}
              accessibilityRole="switch"
              accessibilityLabel={item.label}
              accessibilityState={{
                checked: item.value,
                disabled: busy || !ready,
              }}
              disabled={busy || !ready}
              onPress={() => toggle(item.key)}>
              <MaterialIcons name={item.icon} size={24} color="#3832FF" />
              <Text allowFontScaling={false} style={styles.label}>
                {item.label}
              </Text>
              <View style={[styles.track, item.value && styles.trackOn]}>
                <View style={[styles.thumb, item.value && styles.thumbOn]} />
              </View>
            </Pressable>
          ))}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.actions}>
            <Pressable
              style={[styles.action, styles.logout]}
              accessibilityRole="button"
              accessibilityLabel="Logout"
              disabled={busy}
              onPress={() => confirmAction(false)}>
              <Text allowFontScaling={false} style={styles.actionText}>
                Logout
              </Text>
              <MaterialIcons name="logout" size={19} color="#FF0000" />
            </Pressable>
            <Pressable
              style={[styles.action, styles.delete]}
              accessibilityRole="button"
              accessibilityLabel="Delete account"
              disabled={busy}
              onPress={() => confirmAction(true)}>
              <Text allowFontScaling={false} style={styles.actionText}>
                Delete Account
              </Text>
              <MaterialIcons name="delete-outline" size={20} color="#FF0000" />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: '#00000055',
  },
  card: {
    width: '100%',
    maxWidth: 540,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 16,
    gap: 12,
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.14,
    shadowRadius: 12,
  },
  row: {
    height: 48,
    borderWidth: 1,
    borderColor: '#F1F1F1',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
    elevation: 1,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: {width: 0, height: 1},
  },
  label: {flex: 1, fontSize: 14, color: '#080808', fontWeight: '500'},
  track: {
    width: 36,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#D9D9D9',
    padding: 5,
  },
  trackOn: {backgroundColor: '#3832FF'},
  thumb: {width: 12, height: 12, borderRadius: 6, backgroundColor: '#FFFFFF'},
  thumbOn: {alignSelf: 'flex-end'},
  actions: {flexDirection: 'row', gap: 12, marginTop: 12},
  action: {
    flex: 1,
    minHeight: 44,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logout: {backgroundColor: '#FFE9E9'},
  delete: {borderWidth: 1, borderColor: '#FF0000'},
  actionText: {fontSize: 13, color: '#FF0000'},
  error: {fontSize: 12, lineHeight: 17, color: '#B42318'},
});
