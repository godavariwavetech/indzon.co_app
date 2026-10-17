import {useFocusEffect} from '@react-navigation/native';
import SuccessCelebration from '../../components/main/SuccessCelebration';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Clipboard,
  Keyboard,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Svg, {Line, Path} from 'react-native-svg';
import {Page} from '../../components/main/MainUi';
import {money} from '../../config/catalog';
import {setCouponCode} from '../../redux/reducers/commerce';
import {
  evaluateLiveCoupon,
  getLiveCoupons,
  liveCatalogEnabled,
  useLiveItemsByIds,
} from '../../services/catalogService';

export default function CouponsScreen({navigation}) {
  const dispatch = useDispatch();
  const {width} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scale = Math.min(width / 393, 1);
  const cart = useSelector(state => state.commerce.cart);
  const locationId = useSelector(state => state.Auth.locationId);
  const selected = useSelector(state => state.commerce.couponCode);
  const [success, setSuccess] = useState(null);
  const applying = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!success) return;
      const timer = setTimeout(() => {
        setSuccess(null);
        applying.current = false;
        navigation.goBack();
      }, 1400);
      return () => clearTimeout(timer);
    }, [navigation, success]),
  );
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const cartIds = Object.keys(cart);
  const {itemsById} = useLiveItemsByIds(cartIds);
  const items = cartIds
    .map(id => itemsById[id])
    .filter(Boolean)
    .map(item => ({...item, quantity: cart[item.id]}));
  const [liveOffers, setLiveOffers] = useState([]);
  useEffect(() => {
    if (!liveCatalogEnabled || !locationId) {
      return;
    }
    getLiveCoupons({
      locationId,
      categoryId: items[0]?.categoryId || 0,
      shopId: items[0]?.shopId || 0,
    })
      .then(setLiveOffers)
      .catch(() => setLiveOffers([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId, items[0]?.categoryId, items[0]?.shopId]);
  const offers = liveOffers;
  const apply = value => {
    if (applying.current) return;
    const result = evaluateLiveCoupon(value, liveOffers, items);
    if (result.error) {
      setMessage(result.error);
      setError(true);
      return;
    }
    applying.current = true;
    Keyboard.dismiss();
    dispatch(setCouponCode(result.code));
    setSuccess(result);
  };
  return (
    <Page>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to cart"
          onPress={() => navigation.goBack()}
          hitSlop={10}>
          <MaterialIcons name="arrow-back" size={24} color="#171A1D" />
        </Pressable>
        <Text allowFontScaling={false} style={styles.heading}>
          Coupons
        </Text>
      </View>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            {paddingBottom: insets.bottom + 24},
          ]}>
          <View style={styles.entry}>
            <MaterialIcons name="local-offer" size={19} color="#3832FF" />
            <TextInput
              style={styles.input}
              value={code}
              onChangeText={value => {
                setCode(value);
                setMessage('');
              }}
              placeholder="Enter coupon code"
              placeholderTextColor="#5C5050"
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={() => apply(code)}
              accessibilityLabel="Coupon code"
              maxLength={30}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Apply entered coupon"
              onPress={() => apply(code)}
              style={styles.entryApply}>
              <Text allowFontScaling={false} style={styles.entryApplyText}>
                Apply
              </Text>
            </Pressable>
          </View>
          {message ? (
            <Text
              accessibilityLiveRegion="polite"
              style={[styles.message, error && styles.error]}>
              {message}
            </Text>
          ) : null}
          {selected ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                dispatch(setCouponCode(null));
                setError(false);
                setMessage('Coupon removed.');
              }}
              style={styles.remove}>
              <Text style={styles.removeText}>Remove {selected}</Text>
              <MaterialIcons name="close" color="#3832FF" size={18} />
            </Pressable>
          ) : null}
          <View style={styles.list}>
            {offers.map(offer => (
              <View
                key={offer.code}
                style={styles.ticket}>
                <Svg
                  style={StyleSheet.absoluteFillObject}
                  width="100%"
                  height="100%"
                  viewBox="0 0 361 94"
                  preserveAspectRatio="none">
                  <Path
                    d="M10 1 H88 C96 1 96 10 104 10 S112 1 120 1 H351 Q360 1 360 10 V84 Q360 93 351 93 H120 C112 93 112 84 104 84 S96 93 88 93 H10 Q1 93 1 84 V10 Q1 1 10 1Z"
                    fill="#FFFFFF"
                    stroke="#DEDDFF"
                    strokeWidth="0.8"
                  />
                  <Line
                    x1="104"
                    y1="15"
                    x2="104"
                    y2="79"
                    stroke="#8D86FF"
                    strokeWidth="0.6"
                    strokeDasharray="2 2"
                  />
                </Svg>
                <View style={styles.badgeArea}>
                  <View style={styles.badge}>
                    <Text
                      allowFontScaling={false}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.65}
                      style={[
                        styles.badgeLabel,
                        {fontSize: (offer.label.length > 8 ? 8 : 10) * scale},
                      ]}>
                      {offer.label || ' '}
                    </Text>
                    <Text
                      allowFontScaling={false}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.65}
                      style={[styles.badgeValue, {fontSize: 25 * scale}]}>
                      {offer.badge.replace(/\s+/g, '')}
                    </Text>
                    <Text
                      allowFontScaling={false}
                      style={[styles.off, {fontSize: 10 * scale}]}>
                      OFF
                    </Text>
                  </View>
                </View>
                <View style={styles.offer}>
                  <View style={styles.titleRow}>
                    <MaterialIcons
                      name="loyalty"
                      size={15 * scale}
                      color="#3832FF"
                    />
                    <Text
                      allowFontScaling={false}
                      numberOfLines={2}
                      style={[
                        styles.title,
                        {fontSize: 14 * scale, lineHeight: 18 * scale},
                      ]}>
                      {offer.title}
                    </Text>
                  </View>
                  <Text
                    allowFontScaling={false}
                    numberOfLines={2}
                    style={[styles.caption, {fontSize: 12 * scale, lineHeight: 16 * scale}]}>
                    {offer.caption}
                  </Text>
                  <View style={styles.bottomRow}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Copy ${offer.code}`}
                      style={styles.code}
                      onPress={() => {
                        Clipboard.setString(offer.code);
                        setCode(offer.code);
                        setError(false);
                        setMessage(`${offer.code} copied.`);
                      }}>
                      <Text
                        allowFontScaling={false}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.75}
                        style={[styles.codeText, {fontSize: 11 * scale}]}>
                        {offer.code}
                      </Text>
                      <MaterialIcons
                        name="content-copy"
                        size={13 * scale}
                        color="#757579"
                      />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Apply ${offer.code}`}
                      accessibilityState={{selected: selected === offer.code}}
                      onPress={() => apply(offer.code)}
                      style={[styles.apply, selected === offer.code && styles.applied]}>
                      <Text
                        allowFontScaling={false}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        style={[styles.applyText, {fontSize: 11 * scale}]}>
                        {selected === offer.code ? 'Applied' : offer.action}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Modal
        visible={Boolean(success)}
        transparent
        animationType="none"
        onRequestClose={() => {
          setSuccess(null);
          applying.current = false;
          navigation.goBack();
        }}>
        <View style={styles.successBackdrop}>
          <View style={styles.successCard} accessibilityLiveRegion="polite">
            {success ? <SuccessCelebration /> : null}
            <Text style={styles.successTitle}>Coupon applied!</Text>
            <Text style={styles.successSavings}>
              You saved {money(success?.discount || 0)}
            </Text>
            <Text style={styles.successCode}>{success?.code}</Text>
          </View>
        </View>
      </Modal>
    </Page>
  );
}

const styles = StyleSheet.create({
  successBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(24,20,48,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    alignItems: 'center',
    padding: 24,
  },
  successTitle: {
    fontFamily: 'Lato-Bold',
    fontSize: 23,
    color: '#202427',
    marginTop: 8,
  },
  successSavings: {
    fontFamily: 'Lato-Bold',
    fontSize: 18,
    color: '#16845E',
    marginTop: 12,
  },
  successCode: {
    fontFamily: 'Lato-Regular',
    fontSize: 14,
    color: '#68627D',
    marginTop: 12,
  },
  flex: {flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  heading: {fontSize: 19, fontWeight: '700', color: '#202427'},
  content: {paddingHorizontal: 16, paddingTop: 3},
  entry: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: '#ECECEC',
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 10,
  },
  input: {flex: 1, minWidth: 0, fontSize: 14, color: '#202427', padding: 0},
  entryApply: {
    backgroundColor: '#3832FF',
    borderRadius: 9,
    paddingHorizontal: 14,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryApplyText: {fontSize: 13, fontWeight: '600', color: '#FFFFFF'},
  message: {fontSize: 12, lineHeight: 17, color: '#247245', marginTop: 10},
  error: {color: '#C62828'},
  remove: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 12,
  },
  removeText: {fontSize: 12, color: '#3832FF'},
  list: {gap: 10, marginTop: 12},
  ticket: {flexDirection: 'row'},
  badgeArea: {width: '29%', padding: 7, paddingRight: 10},
  badge: {
    flex: 1,
    borderRadius: 11,
    backgroundColor: '#EEECFF',
    paddingHorizontal: 6,
    paddingVertical: 6,
    justifyContent: 'center',
    gap: 3,
  },
  badgeLabel: {color: '#77718C', fontWeight: '600', textAlign: 'center'},
  badgeValue: {color: '#3832FF', fontWeight: '700', includeFontPadding: false, textAlign: 'center'},
  off: {color: '#77718C', fontWeight: '500', textAlign: 'center'},
  offer: {flex: 1, minWidth: 0, paddingLeft: 10, paddingRight: 9, paddingVertical: 9},
  titleRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  title: {flex: 1, color: '#080808', fontWeight: '600'},
  caption: {color: '#757575', marginTop: 3, marginBottom: 6},
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  code: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 32,
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderWidth: 0.7,
    borderStyle: 'dashed',
    borderColor: '#D3D0E6',
    backgroundColor: '#FAF9FF',
    borderRadius: 6,
  },
  codeText: {flexShrink: 1, color: '#3832FF', fontWeight: '600'},
  apply: {
    width: 70,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3832FF',
    borderRadius: 9,
    paddingHorizontal: 7,
    paddingVertical: 5,
  },
  applyText: {fontWeight: '500', color: '#FFFFFF'},
  applied: {backgroundColor: '#16845E'},
});
