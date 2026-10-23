import {useFocusEffect} from '@react-navigation/native';
import SuccessCelebration from '../../components/main/SuccessCelebration';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Clipboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {Page} from '../../components/main/MainUi';
import GradientButton from '../../components/main/GradientButton';
import {LoadingImage as Image} from '../../components/main/Skeleton';
import {money} from '../../config/catalog';
import {setCouponCode} from '../../redux/reducers/commerce';
import {
  evaluateLiveCoupon,
  getAllLiveCoupons,
  getLiveCategories,
  liveCatalogEnabled,
  useLiveItemsByIds,
} from '../../services/catalogService';

// Card colour themes, cycled across the coupon grid.
const THEMES = [
  {bg: '#E4F6EA', border: '#BFE6CC', ink: '#138A4B', circle: '#CDEFD8'},
  {bg: '#FFE4E8', border: '#F7BBC4', ink: '#E0443E', circle: '#FFCDD4'},
  {bg: '#FFF1CC', border: '#F6DA8E', ink: '#E07B00', circle: '#FFE39A'},
  {bg: '#E1EBFF', border: '#BCD0FA', ink: '#2F35F5', circle: '#C9D9FF'},
  {bg: '#F1E6FF', border: '#D8C2F7', ink: '#7A3BD6', circle: '#E3D0FB'},
];

const discountTitle = offer =>
  offer.percent ? `${offer.percent}% OFF` : `Flat ₹${offer.cap} OFF`;

function CodeBox({code, color, onCopy, style}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Copy ${code}`}
      onPress={() => onCopy(code)}
      style={[styles.codeBox, {borderColor: color}, style]}>
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.85}
        style={[styles.codeText, {color}]}>
        {code}
      </Text>
      <MaterialIcons name="content-copy" size={15} color={color} />
    </Pressable>
  );
}

function Illustration({uri, size, icon, color}) {
  return uri ? (
    <Image
      source={{uri}}
      resizeMode="contain"
      style={{width: size, height: size}}
    />
  ) : (
    <MaterialIcons name={icon} size={size * 0.7} color={color} />
  );
}

// Decorative tickets for the header, drawn with plain views.
function HeroArt() {
  return (
    <View pointerEvents="none" style={styles.heroArt}>
      <View style={styles.heroBlob} />
      <View style={[styles.ticket, styles.ticketBack]} />
      <View style={[styles.ticket, styles.ticketFront]}>
        <Text allowFontScaling={false} style={styles.ticketPercent}>
          %
        </Text>
      </View>
      <View style={[styles.coin, {top: 16, right: 6}]} />
      <View style={[styles.coin, {bottom: 18, left: 18, width: 22, height: 22}]} />
      <View style={styles.heroBadge}>
        <Text allowFontScaling={false} style={styles.heroBadgeText}>
          %
        </Text>
      </View>
      <MaterialIcons
        name="card-giftcard"
        size={44}
        color="#F6B93B"
        style={styles.heroGift}
      />
    </View>
  );
}

export default function CouponsScreen({navigation}) {
  const dispatch = useDispatch();
  const {width} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const cart = useSelector(state => state.commerce.cart);
  const locationId = useSelector(state => state.Auth.locationId);
  const selected = useSelector(state => state.commerce.couponCode);
  const [success, setSuccess] = useState(null);
  const applying = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!success) {
        return;
      }
      const timer = setTimeout(() => {
        setSuccess(null);
        applying.current = false;
        navigation.goBack();
      }, 1400);
      return () => clearTimeout(timer);
    }, [navigation, success]),
  );
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const cartIds = Object.keys(cart);
  const {itemsById} = useLiveItemsByIds(cartIds);
  const items = cartIds
    .map(id => itemsById[id])
    .filter(Boolean)
    .map(item => ({...item, quantity: cart[item.id]}));
  const [liveOffers, setLiveOffers] = useState([]);
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    if (!liveCatalogEnabled || !locationId) {
      return;
    }
    getAllLiveCoupons({locationId})
      .then(setLiveOffers)
      .catch(() => setLiveOffers([]));
    getLiveCategories()
      .then(setCategories)
      .catch(() => {});
  }, [locationId]);
  const categoryById = useMemo(() => {
    const map = {};
    categories.forEach(category => {
      map[category.id] = category;
    });
    return map;
  }, [categories]);
  // The richest offer becomes the hero card; the rest fill the grid.
  const featured = useMemo(
    () =>
      liveOffers.reduce(
        (best, offer) =>
          !best || (offer.percent || 0) > (best.percent || 0) ? offer : best,
        null,
      ),
    [liveOffers],
  );
  const others = liveOffers.filter(offer => offer !== featured);
  const apply = value => {
    if (applying.current) {
      return;
    }
    const result = evaluateLiveCoupon(value, liveOffers, items);
    if (result.error) {
      setMessage(result.error);
      setError(true);
      return;
    }
    applying.current = true;
    dispatch(setCouponCode(result.code));
    setSuccess(result);
  };
  const copy = value => {
    Clipboard.setString(value);
    setError(false);
    setMessage(`${value} copied.`);
  };
  const tagFor = offer => {
    const category = categoryById[offer.categoryId];
    if (category) {
      return category.name.toUpperCase();
    }
    return offer.label === 'ONE-TIME' ? 'ONE-TIME' : 'ALL ORDERS';
  };
  const cardWidth = Math.floor((width - 32 - 12) / 2);
  const featuredArt = featured && categoryById[featured.categoryId]?.art.source.uri;
  return (
    <Page>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => navigation.goBack()}
          hitSlop={10}>
          <MaterialIcons name="arrow-back" size={26} color="#171A1D" />
        </Pressable>
        <Text allowFontScaling={false} style={styles.heading}>
          Coupons
        </Text>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: insets.bottom + 28}}>
        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <Text allowFontScaling={false} style={styles.eyebrow}>
              EXCLUSIVE REWARDS
            </Text>
            <Text allowFontScaling={false} style={styles.heroTitle}>
              Coupons
            </Text>
            <Text style={styles.heroSub}>More savings. More reasons to shop.</Text>
          </View>
          <HeroArt />
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

        {featured ? (
          <View style={styles.featured}>
            <View style={styles.featuredLeft}>
              <Text allowFontScaling={false} style={styles.featuredFlat}>
                {featured.percent ? 'FLAT' : 'SAVE'}
              </Text>
              <Text
                allowFontScaling={false}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
                style={styles.featuredValue}>
                {featured.badge}
              </Text>
              <Text allowFontScaling={false} style={styles.featuredFlat}>
                OFF
              </Text>
              <View style={styles.notch} />
            </View>
            <View style={styles.featuredRight}>
              <View style={styles.bestDeal}>
                <Text allowFontScaling={false} style={styles.bestDealText}>
                  BEST DEAL
                </Text>
              </View>
              <Text style={styles.featuredTitle} numberOfLines={1}>
                Get {discountTitle(featured)}
              </Text>
              <Text style={styles.featuredCaption} numberOfLines={2}>
                {featured.cap
                  ? `Up to ₹${featured.cap} on your order`
                  : featured.caption}
              </Text>
              <View style={styles.featuredActions}>
                <CodeBox
                  code={featured.code}
                  color="#3832FF"
                  onCopy={copy}
                  style={styles.featuredCode}
                />
                <GradientButton
                  accessibilityLabel={`Apply ${featured.code}`}
                  onPress={() => apply(featured.code)}
                  height={44}
                  colors={
                    selected === featured.code
                      ? ['#16845E', '#16845E']
                      : undefined
                  }
                  style={styles.featuredApply}
                  label={selected === featured.code ? 'Applied' : 'Apply Now'}
                />
              </View>
              {featuredArt ? (
                <View pointerEvents="none" style={styles.featuredArt}>
                  <Illustration uri={featuredArt} size={74} />
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        <View style={styles.sectionHeading}>
          <View style={styles.sectionIcon}>
            <MaterialIcons name="confirmation-number" size={20} color="#3832FF" />
          </View>
          <Text allowFontScaling={false} style={styles.sectionTitle}>
            All Coupons
          </Text>
        </View>

        <View style={styles.grid}>
          {others.map((offer, index) => {
            const theme = THEMES[index % THEMES.length];
            const art = categoryById[offer.categoryId]?.art.source.uri;
            const isApplied = selected === offer.code;
            return (
              <View
                key={offer.id || offer.code}
                style={[
                  styles.card,
                  {width: cardWidth, backgroundColor: theme.bg, borderColor: theme.border},
                ]}>
                <View
                  pointerEvents="none"
                  style={[styles.cardCircle, {backgroundColor: theme.circle}]}
                />
                <View style={styles.cardArt} pointerEvents="none">
                  <Illustration uri={art} size={56} icon="local-offer" color={theme.ink} />
                </View>
                <View
                  style={[
                    styles.tag,
                    {backgroundColor: theme.ink, maxWidth: cardWidth - 76},
                  ]}>
                  <Text
                    allowFontScaling={false}
                    numberOfLines={1}
                    style={styles.tagText}>
                    {tagFor(offer)}
                  </Text>
                </View>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {discountTitle(offer)}
                </Text>
                <Text style={styles.cardCaption} numberOfLines={2}>
                  {offer.caption}
                </Text>
                <CodeBox code={offer.code} color={theme.ink} onCopy={copy} />
                <GradientButton
                  accessibilityLabel={`Apply ${offer.code}`}
                  onPress={() => apply(offer.code)}
                  height={40}
                  colors={isApplied ? ['#16845E', '#16845E'] : undefined}
                  style={styles.cardApply}
                  label={isApplied ? 'Applied' : 'Apply Now'}
                />
                <Text style={styles.cardFoot}>
                  {offer.minBill ? `Min. order ₹${offer.minBill}` : 'No minimum order'}
                </Text>
              </View>
            );
          })}
        </View>
        {!liveOffers.length ? (
          <Text style={styles.empty}>No coupons available right now.</Text>
        ) : null}
      </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  heading: {fontSize: 21, fontWeight: '700', color: '#202427'},
  hero: {
    minHeight: 190,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroCopy: {flex: 1, zIndex: 2},
  eyebrow: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 3,
    color: '#3832FF',
    marginBottom: 6,
  },
  heroTitle: {fontSize: 40, fontWeight: '800', color: '#101223'},
  heroSub: {fontSize: 14, color: '#6B6F7E', marginTop: 6, maxWidth: 190},
  heroArt: {width: 170, height: 170, marginRight: -4},
  heroBlob: {
    position: 'absolute',
    right: -40,
    top: -10,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#DCD8FF',
    opacity: 0.7,
  },
  ticket: {
    position: 'absolute',
    width: 130,
    height: 78,
    borderRadius: 14,
  },
  ticketBack: {
    right: 2,
    top: 22,
    backgroundColor: '#A98BF5',
    transform: [{rotate: '12deg'}],
  },
  ticketFront: {
    left: 6,
    top: 70,
    backgroundColor: '#4B4DF0',
    transform: [{rotate: '-14deg'}],
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketPercent: {fontSize: 46, fontWeight: '800', color: '#FFFFFF'},
  coin: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F6B93B',
    borderWidth: 3,
    borderColor: '#FFD97A',
  },
  heroBadge: {
    position: 'absolute',
    right: 10,
    bottom: 22,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#3E6BF0',
    borderWidth: 3,
    borderColor: '#8FB0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadgeText: {fontSize: 22, fontWeight: '800', color: '#FFFFFF'},
  heroGift: {position: 'absolute', left: 14, top: 4},
  message: {fontSize: 13, lineHeight: 18, color: '#247245', marginHorizontal: 20, marginBottom: 8},
  error: {color: '#C62828'},
  remove: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginHorizontal: 20,
    paddingVertical: 8,
  },
  removeText: {fontSize: 13, color: '#3832FF'},
  featured: {
    marginHorizontal: 16,
    flexDirection: 'row',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#DAD3FF',
    backgroundColor: '#F4EFFF',
  },
  featuredLeft: {
    width: 104,
    backgroundColor: '#3B2FF0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 22,
  },
  featuredFlat: {fontSize: 14, fontWeight: '700', letterSpacing: 4, color: '#FFFFFF'},
  featuredValue: {fontSize: 44, fontWeight: '800', color: '#FFFFFF', maxWidth: 92},
  notch: {
    position: 'absolute',
    right: -14,
    top: '50%',
    marginTop: -14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F4EFFF',
  },
  featuredRight: {flex: 1, padding: 12, paddingLeft: 18},
  bestDeal: {
    alignSelf: 'flex-start',
    backgroundColor: '#FF4F81',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  bestDealText: {fontSize: 11, fontWeight: '800', letterSpacing: 1.5, color: '#FFFFFF'},
  featuredTitle: {fontSize: 21, fontWeight: '800', color: '#101223', maxWidth: 150},
  featuredCaption: {fontSize: 13, color: '#757A8A', marginTop: 4, marginBottom: 10, maxWidth: 150},
  featuredActions: {flexDirection: 'row', alignItems: 'center', gap: 8},
  featuredApply: {minWidth: 96},
  featuredCode: {flex: 1, marginTop: 0, minHeight: 44, borderRadius: 12, paddingHorizontal: 8},
  featuredApplyText: {fontSize: 13},
  featuredArt: {position: 'absolute', right: 6, top: 6},
  applied: {backgroundColor: '#16845E'},
  applyText: {fontSize: 14, fontWeight: '700', color: '#FFFFFF'},
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 26,
    marginBottom: 14,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8E6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {fontSize: 21, fontWeight: '800', color: '#101223'},
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 14,
    overflow: 'hidden',
  },
  cardCircle: {
    position: 'absolute',
    right: -22,
    top: -22,
    width: 110,
    height: 110,
    borderRadius: 55,
    opacity: 0.7,
  },
  cardArt: {position: 'absolute', right: 6, top: 6, width: 56, height: 56},
  tag: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  tagText: {fontSize: 10, fontWeight: '800', letterSpacing: 0.5, color: '#FFFFFF'},
  cardTitle: {fontSize: 22, fontWeight: '800', color: '#101223', marginTop: 34},
  cardCaption: {fontSize: 13, color: '#6F7482', marginTop: 4, minHeight: 34},
  codeBox: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    paddingHorizontal: 10,
    borderWidth: 1.2,
    borderStyle: 'dashed',
    borderRadius: 10,
    backgroundColor: '#FFFFFFB0',
    marginTop: 10,
  },
  codeText: {flexShrink: 1, fontSize: 14, fontWeight: '800', letterSpacing: 0.5},
  cardApply: {marginTop: 10},
  cardFoot: {fontSize: 12, color: '#707585', textAlign: 'center', marginTop: 8},
  empty: {textAlign: 'center', color: '#707585', marginTop: 24, fontSize: 14},
});
