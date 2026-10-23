import {Text, TextInput} from '../../components/Typography';
import React, {useEffect, useState} from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import {getLiveItems} from '../../services/catalogService';
import {
  addSupportMessage,
  setProfileDetails,
} from '../../redux/reducers/commerce';
import {
  getCustomerProfile,
  setCustomerName,
  updateCustomerProfile,
} from '../../redux/reducers/auth';
import {ENABLE_LIVE_DATA} from '../../config/appMode';
import {
  colors,
  EmptyState,
  Footer,
  Heading,
  Page,
  usePageReady,
  ui,
} from '../../components/main/MainUi';
import GradientButton, {
  gradientButtonLabel,
} from '../../components/main/GradientButton';
import ReferenceArtwork from '../../components/main/ReferenceArtwork';
import ProductCard from '../../components/main/ProductCard';
import CartPill from '../../components/main/CartPill';

export function ShopDetailsScreen({navigation, route}) {
  const {width} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const {shopId, shopItemsTableName, shopName} = route.params || {};
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(Boolean(shopItemsTableName));
  useEffect(() => {
    if (!shopItemsTableName) {
      return undefined;
    }
    let active = true;
    getLiveItems({shopItemsTableName, shopId})
      .then(rows => active && setItems(rows))
      .catch(() => active && setItems([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [shopId, shopItemsTableName]);
  return (
    <Page>
      <Heading title={shopName || 'Shop'} navigation={navigation} back />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[ui.sectionTitle, {marginVertical: 20}]}>Products</Text>
        <View style={styles.grid}>
          {items.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              width={(width - 44) / 2}
              navigation={navigation}
            />
          ))}
        </View>
        {!items.length && !loading ? (
          <EmptyState message="No products available in this shop." />
        ) : null}
      </ScrollView>
      <CartPill navigation={navigation} bottomInset={insets.bottom} />
    </Page>
  );
}

export function MyAccountScreen({navigation}) {
  const pageReady = usePageReady();
  const dispatch = useDispatch();
  const savedName = useSelector(state => state.commerce.profileName);
  const savedEmail = useSelector(state => state.commerce.profileEmail);
  const auth = useSelector(state => state.Auth);
  const initialName =
    auth.customerName || savedName || auth.deliveryAddress?.customer_name || '';
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(savedEmail || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!ENABLE_LIVE_DATA || !auth.customerId) {
      return;
    }
    dispatch(getCustomerProfile({customer_id: auth.customerId}))
      .unwrap()
      .then(data => {
        const profile = Array.isArray(data?.data) ? data.data[0] : null;
        if (profile?.customer_name) {
          setName(profile.customer_name);
          // keep the Profile screen and the rest of the app on the same name
          dispatch(setCustomerName(profile.customer_name));
          dispatch(setProfileDetails({name: profile.customer_name, email: profile.customer_email || ''}));
        }
        if (profile?.customer_email) {
          setEmail(profile.customer_email);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.customerId]);
  const phone = String(auth.mobileNumber || '').trim();
  const displayPhone = phone
    ? phone.startsWith('+')
      ? phone
      : `+91 ${phone}`
    : 'Phone number unavailable';
  const initials = (name.trim() || 'A')
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();
  const saveName = async () => {
    if (!name.trim()) {
      setError('Enter your name to continue.');
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    if (ENABLE_LIVE_DATA && auth.customerId) {
      setSaving(true);
      try {
        await dispatch(
          updateCustomerProfile({
            customer_id: auth.customerId,
            customer_name: name.trim(),
            customer_mobile_number: auth.mobileNumber || '',
            customer_email: email.trim(),
            imageevent: 0,
            previous_image: '',
          }),
        ).unwrap();
      } catch (err) {
        setError(err.message || 'Could not save your profile. Please try again.');
        setSaving(false);
        return;
      }
      setSaving(false);
    }
    dispatch(setProfileDetails({name, email}));
    dispatch(setCustomerName(name.trim()));
    navigation.goBack();
  };
  return (
    <Page>
      <Heading title="Edit Profile" navigation={navigation} back />
      <ScrollView
        style={styles.accountPage}
        contentContainerStyle={styles.accountContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#31436A', '#465995']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.accountHero}>
          <View pointerEvents="none" style={styles.accountGlow} />
          <View pointerEvents="none" style={styles.accountGlowTwo} />
          <View style={styles.accountAvatar}>
            <Text style={styles.accountInitials}>{initials || 'A'}</Text>
          </View>
          <View style={styles.accountHeroCopy}>
            <Text style={styles.accountEyebrow}>YOUR INDZON ACCOUNT</Text>
            <Text numberOfLines={1} style={styles.accountHeroName}>
              {name.trim() || 'INDZON Member'}
            </Text>
            <Text numberOfLines={1} style={styles.accountHeroPhone}>
              {displayPhone}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.accountIntro}>
          <Text style={styles.accountTitle}>Personal details</Text>
          <Text style={styles.accountSubtitle}>
            Keep your contact information up to date for a smoother checkout.
          </Text>
        </View>

        <View
          style={[styles.accountCard, pageReady && styles.accountCardShadow]}>
          <View style={styles.accountFieldHeading}>
            <View style={styles.accountFieldIcon}>
              <MaterialIcons
                name="person-outline"
                size={19}
                color={colors.primary}
              />
            </View>
            <Text style={styles.accountFieldTitle}>Full name</Text>
          </View>
          <View style={styles.accountInputShell}>
            <TextInput
              value={name}
              onChangeText={value => {
                setName(value);
                setError('');
              }}
              onSubmitEditing={saveName}
              style={styles.accountInput}
              placeholder="Enter your full name"
              placeholderTextColor="#9AA1B0"
              accessibilityLabel="Your full name"
              autoComplete="name"
              autoCapitalize="words"
              returnKeyType="done"
              maxLength={60}
            />
            {name ? (
              <Pressable
                onPress={() => {
                  setName('');
                  setError('');
                }}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Clear full name">
                <MaterialIcons name="close" size={19} color="#8991A0" />
              </Pressable>
            ) : null}
          </View>

          <View style={[styles.accountFieldHeading, styles.phoneHeading]}>
            <View style={styles.accountFieldIcon}>
              <MaterialIcons
                name="mail-outline"
                size={19}
                color={colors.primary}
              />
            </View>
            <Text style={styles.accountFieldTitle}>Email address</Text>
            <Text style={styles.accountHint}>Optional</Text>
          </View>
          <View style={styles.accountInputShell}>
            <TextInput
              value={email}
              onChangeText={value => {
                setEmail(value);
                setError('');
              }}
              style={styles.accountInput}
              placeholder="Enter your email address"
              placeholderTextColor="#9AA1B0"
              accessibilityLabel="Your email address"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={254}
              returnKeyType="done"
              onSubmitEditing={saveName}
            />
          </View>

          <View style={[styles.accountFieldHeading, styles.phoneHeading]}>
            <View style={styles.accountFieldIcon}>
              <MaterialIcons
                name="phone-iphone"
                size={18}
                color={colors.primary}
              />
            </View>
            <View style={styles.accountPhoneHeading}>
              <Text style={styles.accountFieldTitle}>Phone number</Text>
              {phone ? (
                <View style={styles.verifiedBadge}>
                  <MaterialIcons name="check" size={12} color="#12805C" />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              ) : null}
            </View>
          </View>
          <View style={styles.accountPhoneValue}>
            <Text style={styles.accountPhoneText}>{displayPhone}</Text>
            <MaterialIcons name="lock-outline" size={17} color="#80899A" />
          </View>
          <Text style={styles.accountHint}>
            {phone
              ? 'Your verified number is used for sign-in and order updates.'
              : 'Add a phone number to receive sign-in codes and order updates.'}
          </Text>
          {error ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          ) : null}
        </View>
      </ScrollView>
      <Footer style={styles.accountFooter}>
        <GradientButton
          style={styles.accountSaveButton}
          disabled={saving}
          onPress={saveName}
          label={saving ? 'Saving…' : 'Save changes'}>
          <MaterialIcons name="check" size={19} color="#FFFFFF" />
          <Text style={gradientButtonLabel}>
            {saving ? 'Saving…' : 'Save changes'}
          </Text>
        </GradientButton>
      </Footer>
    </Page>
  );
}

export function HelpSupportScreen({navigation}) {
  const dispatch = useDispatch();
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  return (
    <Page>
      <Heading title="Help & Support" navigation={navigation} back />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <Text style={ui.sectionTitle}>How can we help?</Text>
        <Text style={styles.description}>
          Find your delivery address under Profile → Address. View previous
          purchases in My orders, or manage products in your cart.
        </Text>
        <Text style={styles.label}>Your message</Text>
        <TextInput
          value={message}
          onChangeText={value => {
            setMessage(value);
            setError('');
            setNotice('');
          }}
          multiline
          textAlignVertical="top"
          style={[styles.input, {minHeight: 130}]}
          placeholder="Describe what you need help with"
          accessibilityLabel="Support message"
        />
        {error ? (
          <Text style={styles.error} accessibilityRole="alert">
            {error}
          </Text>
        ) : null}
        {notice ? (
          <Text style={styles.notice} accessibilityLiveRegion="polite">
            {notice}
          </Text>
        ) : null}
        <GradientButton
          style={{marginTop: 16}}
          label="Save Message"
          onPress={() => {
            if (!message.trim()) {
              setError('Enter your message.');
              return;
            }
            dispatch(addSupportMessage(message));
            setMessage('');
            setNotice(
              'Draft saved for this session. It has not been sent to support.',
            );
          }}
        />
      </ScrollView>
    </Page>
  );
}

export function AboutUsScreen({navigation}) {
  return (
    <Page>
      <Heading title="About Us" navigation={navigation} back />
      <ScrollView
        contentContainerStyle={styles.aboutContent}
        showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#302ACB', '#635DFF']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.aboutHero}>
          <View pointerEvents="none" style={styles.aboutOrb} />
          <View style={styles.aboutBrandIcon}>
            <MaterialIcons name="shopping-bag" size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.aboutEyebrow}>MEET YOUR EVERYDAY STORE</Text>
          <Text style={styles.aboutBrand}>INDZON</Text>
          <Text style={styles.aboutTagline}>
            A little of everything.{'\n'}All in one place.
          </Text>
          <Text style={styles.aboutHeroBody}>
            Discover everyday essentials and new favourites, wherever your day
            takes you.
          </Text>
        </LinearGradient>

        <View style={styles.aboutSection}>
          <Text style={styles.aboutSectionTitle}>Made for your everyday</Text>
          <Text style={styles.aboutBody}>
            From your weekly grocery list to something just for you, INDZON
            brings your shopping together in one easy-to-explore space.
          </Text>
          <View style={styles.aboutPills}>
            {[
              'Groceries',
              'Food',
              'Fashion',
              'Electronics',
              'Everyday essentials',
            ].map(label => (
              <View key={label} style={styles.aboutPill}>
                <Text style={styles.aboutPillText}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.aboutSectionTitle}>More ways to make it yours</Text>
        <View style={styles.aboutFeatures}>
          {[
            [
              'grid-view',
              'Discover more',
              'Explore categories and find what fits your day.',
            ],
            [
              'favorite-border',
              'Keep your favourites',
              'Save the things you love and come back to them.',
            ],
            [
              'local-offer',
              'Find your next deal',
              'Browse offers and check available coupons.',
            ],
          ].map(([icon, title, description]) => (
            <View key={title} style={styles.aboutFeature}>
              <View style={styles.aboutFeatureIcon}>
                <MaterialIcons name={icon} size={23} color={colors.primary} />
              </View>
              <View style={styles.aboutFeatureCopy}>
                <Text style={styles.aboutFeatureTitle}>{title}</Text>
                <Text style={styles.aboutBody}>{description}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.aboutLinks}>
          {[
            ['help-outline', 'Help & Support', 'HelpSupport'],
            ['description', 'Terms & Conditions', 'TermsConditions'],
            ['shield', 'Privacy Policy', 'PrivacyPolicy'],
          ].map(([icon, label, screen], index) => (
            <Pressable
              key={screen}
              accessibilityRole="button"
              onPress={() => navigation.navigate(screen)}
              style={[styles.aboutLink, index > 0 && styles.aboutLinkBorder]}>
              <MaterialIcons name={icon} size={21} color={colors.primary} />
              <Text style={styles.aboutLinkText}>{label}</Text>
              <MaterialIcons name="chevron-right" size={23} color="#8B90A3" />
            </Pressable>
          ))}
        </View>
        <Text style={styles.aboutClosing}>Your everyday, with INDZON.</Text>
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  aboutContent: {paddingHorizontal: 20, paddingTop: 6, paddingBottom: 44},
  aboutHero: {padding: 26, borderRadius: 24, overflow: 'hidden'},
  aboutOrb: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255,255,255,0.08)',
    right: -100,
    top: -70,
  },
  aboutBrandIcon: {
    width: 60,
    height: 60,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  aboutEyebrow: {
    fontSize: 12,
    letterSpacing: 1.5,
    fontWeight: '700',
    color: '#E2E0FF',
  },
  aboutBrand: {
    fontSize: 43,
    lineHeight: 52,
    letterSpacing: 2,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 7,
  },
  aboutTagline: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
  },
  aboutHeroBody: {
    fontSize: 17,
    lineHeight: 25,
    color: '#ECEBFF',
    marginTop: 12,
  },
  aboutSection: {marginVertical: 28},
  aboutSectionTitle: {
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '700',
    color: colors.ink,
  },
  aboutBody: {fontSize: 17, lineHeight: 25, color: '#626C7D', marginTop: 7},
  aboutPills: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16},
  aboutPill: {
    backgroundColor: '#F0EFFF',
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  aboutPillText: {fontSize: 14, fontWeight: '600', color: '#4841C5'},
  aboutFeatures: {marginTop: 16, gap: 12},
  aboutFeature: {
    flexDirection: 'row',
    gap: 14,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#F8F9FC',
    borderWidth: 1,
    borderColor: '#EEF0F6',
  },
  aboutFeatureIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EBE9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutFeatureCopy: {flex: 1},
  aboutFeatureTitle: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '700',
    color: colors.ink,
  },
  aboutLinks: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: 16,
    marginTop: 26,
  },
  aboutLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 18,
  },
  aboutLinkBorder: {borderTopWidth: 1, borderTopColor: '#EEF0F6'},
  aboutLinkText: {flex: 1, fontSize: 18, fontWeight: '600', color: colors.ink},
  aboutClosing: {
    textAlign: 'center',
    fontSize: 14,
    color: '#737B8C',
    marginTop: 26,
  },
  search: {marginHorizontal: 16, marginBottom: 16},
  content: {paddingHorizontal: 16, paddingBottom: 84},
  grid: {flexDirection: 'row', flexWrap: 'wrap', gap: 12, rowGap: 24},
  shop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  itemName: {
    fontSize: 15,
    lineHeight: 20,
    color: colors.ink,
    fontWeight: '600',
  },
  muted: {fontSize: 12, lineHeight: 18, color: '#667180', marginTop: 4},
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  total: {fontSize: 22, fontWeight: '700', color: colors.ink},
  original: {
    fontSize: 16,
    color: '#777777',
    textDecorationLine: 'line-through',
  },
  offer: {fontSize: 13, color: '#0057FF', fontWeight: '600', marginTop: 5},
  description: {
    fontSize: 15,
    lineHeight: 23,
    color: '#5C6975',
    marginTop: 20,
    marginBottom: 18,
  },
  secondaryAction: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    justifyContent: 'center',
    padding: 10,
  },
  secondaryText: {fontSize: 14, fontWeight: '600', color: colors.primary},
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  itemPrice: {color: colors.ink, fontWeight: '700', fontSize: 16, marginTop: 8},
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    padding: 7,
  },
  stepText: {fontSize: 17, fontWeight: '700', color: colors.primary},
  bill: {
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    marginVertical: 20,
  },
  billRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  bodyText: {fontSize: 14, color: colors.ink},
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
  },
  orderId: {fontSize: 16, fontWeight: '600', color: '#009740'},
  accountGlowTwo: {
    position: 'absolute',
    width: 108,
    height: 108,
    borderRadius: 54,
    right: 32,
    bottom: -82,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  accountPage: {flex: 1},
  accountContent: {paddingHorizontal: 16, paddingTop: 6, paddingBottom: 20},
  accountHero: {
    minHeight: 116,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 11,
    padding: 15,
    borderRadius: 20,
    overflow: 'hidden',
  },
  accountGlow: {
    position: 'absolute',
    width: 148,
    height: 148,
    borderRadius: 74,
    right: -44,
    top: -82,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  accountAvatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  accountInitials: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '800',
    color: '#40528D',
  },
  accountHeroCopy: {flex: 1, minWidth: 0, zIndex: 1},
  accountEyebrow: {
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.7,
    fontWeight: '700',
    color: '#DCD9FF',
    marginBottom: 3,
  },
  accountHeroName: {
    fontFamily: 'display',
    fontSize: 22,
    lineHeight: 27,
    color: '#FFFFFF',
  },
  accountHeroPhone: {
    fontSize: 12,
    lineHeight: 17,
    color: '#E8E8FF',
    marginTop: 2,
  },
  accountIntro: {marginTop: 22, marginBottom: 12},
  accountTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: colors.ink,
  },
  accountSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: '#737B8C',
    marginTop: 4,
  },
  accountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#EAECF3',
    padding: 16,
  },
  accountCardShadow: {
    shadowColor: '#1E2440',
    shadowOpacity: 0.05,
    shadowRadius: 9,
    shadowOffset: {width: 0, height: 3},
    elevation: 2,
  },
  accountFieldHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  accountFieldIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0EFFF',
  },
  accountFieldTitle: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.ink,
    fontWeight: '700',
  },
  accountInputShell: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D9DDE7',
    borderRadius: 12,
    paddingHorizontal: 13,
    marginTop: 10,
    backgroundColor: '#FFFFFF',
  },
  accountInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 11,
    fontSize: 15,
    color: colors.ink,
  },
  phoneHeading: {marginTop: 22},
  accountPhoneHeading: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#E8F7F0',
  },
  verifiedText: {fontSize: 11, color: '#12805C', fontWeight: '700'},
  accountPhoneValue: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingHorizontal: 13,
    marginTop: 10,
    backgroundColor: '#F5F6FA',
  },
  accountPhoneText: {fontSize: 15, lineHeight: 20, color: '#454D5B'},
  accountHint: {
    fontSize: 12,
    lineHeight: 17,
    color: '#7A8292',
    marginTop: 9,
  },
  accountFooter: {backgroundColor: '#FFFFFF'},
  accountSaveButton: {flex: 1},
  label: {fontSize: 14, color: colors.ink, marginBottom: 8, marginTop: 20},
  input: {
    borderWidth: 1,
    borderColor: '#C8CEDB',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: colors.ink,
  },
  readOnly: {
    borderRadius: 10,
    padding: 14,
    backgroundColor: '#F3F4F8',
    fontSize: 16,
    color: colors.ink,
  },
  error: {fontSize: 13, color: '#C62828', marginTop: 10},
  notice: {fontSize: 13, lineHeight: 20, color: '#009740', marginTop: 12},
});
