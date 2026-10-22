import {Text} from '../../components/Typography';
import React, {useState} from 'react';
import {Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import {actionLogout, deleteAccount} from '../../redux/reducers/auth';
import {
  clearSelectedAddress,
  setUserDetails,
} from '../../redux/reducers/addressSlice';
import {ENABLE_LIVE_DATA} from '../../config/appMode';
import locationService from '../../services/locationService';
import {resetCommerce} from '../../redux/reducers/commerce';
import {staticPersistor} from '../../redux/store';
import {
  colors,
  Heading,
  Page,
  usePageReady,
} from '../../components/main/MainUi';
import SettingsModal from '../../components/main/SettingsModal';

const rows = [
  {
    icon: 'person-outline',
    label: 'My Account',
    detail: 'Personal details and phone number',
    target: 'MyAccount',
  },
  {
    icon: 'favorite-border',
    label: 'Wishlist',
    detail: 'Products you have saved',
    target: 'Wishlist',
  },
  {
    icon: 'location-on',
    label: 'Address',
    detail: 'Manage your delivery locations',
    target: 'AddressList',
  },
  {
    icon: 'settings',
    label: 'Settings',
    detail: 'Location, notifications and account settings',
    target: 'Settings',
  },
  {
    icon: 'support-agent',
    label: 'Help & Support',
    detail: 'Get help with your order or account',
    target: 'HelpSupport',
  },
  {
    icon: 'info-outline',
    label: 'About INDZON',
    detail: 'Learn more about us',
    target: 'AboutUs',
  },
  {
    icon: 'fact-check',
    label: 'Terms & Conditions',
    detail: 'See our terms of service',
    target: 'TermsConditions',
  },
  {
    icon: 'privacy-tip',
    label: 'Privacy Policy',
    detail: 'How we handle your information',
    target: 'PrivacyPolicy',
  },
];

function displayPhone(value) {
  if (!value) {
    return 'Add your phone number';
  }
  const phone = String(value).trim();
  return phone.startsWith('+') ? phone : `+91 ${phone}`;
}

function getInitials(value) {
  const initials = String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('');
  return initials.toUpperCase() || 'A';
}

export default function MainProfileScreen({navigation}) {
  const pageReady = usePageReady();
  const dispatch = useDispatch();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const auth = useSelector(state => state.Auth);
  const profileName = useSelector(state => state.commerce.profileName);
  const displayName =
    profileName || auth.deliveryAddress?.customer_name || 'INDZON Member';

  const logout = async () => {
    setSettingsVisible(false);
    dispatch(actionLogout());
    dispatch(resetCommerce());
    // Clearing the remembered flag switches navigation back to Login.
    await staticPersistor.flush();
  };

  const removeAccount = async () => {
    if (ENABLE_LIVE_DATA && auth.customerId) {
      await dispatch(deleteAccount()).unwrap();
    }
    await locationService.clearSavedAddresses(auth.customerId);
    dispatch(clearSelectedAddress());
    dispatch(setUserDetails(null));
    await logout();
  };

  return (
    <Page>
      <Heading title="Profile" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#31436A', '#465995']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={[styles.profileCard, pageReady && styles.profileCardShadow]}>
          <View pointerEvents="none" style={styles.glowOne} />
          <View pointerEvents="none" style={styles.glowTwo} />
          <View style={styles.avatar}>
            <Text style={styles.initials}>{getInitials(displayName)}</Text>
          </View>
          <View style={styles.profileCopy}>
            <Text style={styles.welcome}>YOUR INDZON ACCOUNT</Text>
            <Text numberOfLines={1} style={styles.name}>
              {displayName}
            </Text>
            <Text numberOfLines={1} style={styles.phone}>
              {displayPhone(auth.mobileNumber)}
            </Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate('MyAccount')}
            accessibilityRole="button"
            accessibilityLabel="Edit account details"
            style={styles.editButton}>
            <MaterialIcons name="edit" size={16} color={colors.primary} />
            <Text style={styles.editLabel}>Edit</Text>
          </Pressable>
        </LinearGradient>

        <Text style={styles.sectionLabel}>YOUR ACCOUNT</Text>
        <View style={styles.menu}>
          {rows.slice(0, 4).map((row, index) => (
            <Pressable
              key={row.target}
              style={[styles.row, index < 3 && styles.dividedRow]}
              onPress={() =>
                row.target === 'Settings'
                  ? setSettingsVisible(true)
                  : navigation.navigate(row.target)
              }
              accessibilityRole="button"
              accessibilityLabel={`${row.label}. ${row.detail}`}>
              <View style={styles.rowIcon}>
                <MaterialIcons
                  name={row.icon}
                  size={21}
                  color={colors.primary}
                />
              </View>
              <View style={styles.rowCopy}>
                <Text style={styles.rowTitle}>{row.label}</Text>
                <Text numberOfLines={1} style={styles.rowDetail}>
                  {row.detail}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={23} color="#9299AA" />
            </Pressable>
          ))}
        </View>

        <Text style={[styles.sectionLabel, styles.sectionSpace]}>
          HELP & INFORMATION
        </Text>
        <View style={styles.menu}>
          {rows.slice(4).map((row, index) => (
            <Pressable
              key={row.target}
              style={[styles.row, index < 3 && styles.dividedRow]}
              onPress={() => navigation.navigate(row.target)}
              accessibilityRole="button"
              accessibilityLabel={`${row.label}. ${row.detail}`}>
              <View style={styles.rowIcon}>
                <MaterialIcons
                  name={row.icon}
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={styles.rowCopy}>
                <Text style={styles.rowTitle}>{row.label}</Text>
                <Text numberOfLines={1} style={styles.rowDetail}>
                  {row.detail}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color="#9299AA" />
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        onLogout={logout}
        onDelete={removeAccount}
      />
    </Page>
  );
}

const styles = StyleSheet.create({
  content: {flexGrow: 1, paddingHorizontal: 16, paddingBottom: 18},
  profileCard: {
    minHeight: 116,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 11,
    padding: 15,
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
  },
  glowOne: {
    position: 'absolute',
    width: 148,
    height: 148,
    borderRadius: 74,
    right: -44,
    top: -82,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  glowTwo: {
    position: 'absolute',
    width: 108,
    height: 108,
    borderRadius: 54,
    right: 32,
    bottom: -82,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  initials: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '800',
    color: '#40528D',
  },
  profileCopy: {flex: 1, minWidth: 0, zIndex: 1},
  welcome: {
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.7,
    fontWeight: '700',
    color: '#DCD9FF',
    marginBottom: 3,
  },
  name: {
    fontFamily: 'display',
    fontSize: 22,
    lineHeight: 27,
    color: '#FFFFFF',
  },
  phone: {fontSize: 12, lineHeight: 17, color: '#E8E8FF', marginTop: 2},
  editButton: {
    minWidth: 58,
    height: 32,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 9,
    zIndex: 1,
  },
  editLabel: {
    fontSize: 12,
    lineHeight: 14,
    color: colors.primary,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.6,
    fontWeight: '700',
    color: '#737B8C',
    marginBottom: 8,
    marginLeft: 3,
  },
  sectionSpace: {marginTop: 18},
  menu: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECEEF5',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 13,
  },
  profileCardShadow: {
    elevation: 1,
    shadowColor: '#1E2440',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: {width: 0, height: 2},
  },
  row: {minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 11},
  dividedRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#ECEEF5',
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0EFFF',
  },
  rowCopy: {flex: 1, minWidth: 0},
  rowTitle: {fontSize: 14, lineHeight: 18, fontWeight: '700', color: '#202427'},
  rowDetail: {fontSize: 12, lineHeight: 16, color: '#788092', marginTop: 2},
});
