import {Text} from '../../components/Typography';
import React, {useEffect, useState} from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import {useSelector} from 'react-redux';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import {moreArtwork} from '../../config/catalog';
import {
  getLiveBanners,
  getLiveCategories,
  getLiveItems,
  getLiveShops,
  liveCatalogEnabled,
  searchAll,
} from '../../services/catalogService';
import {
  colors,
  EmptyState,
  Page,
  SearchField,
  usePageReady,
  ui,
} from '../../components/main/MainUi';
import ReferenceArtwork from '../../components/main/ReferenceArtwork';
import {LoadingImage as Image} from '../../components/main/Skeleton';
import ProductCard from '../../components/main/ProductCard';
import CartPill from '../../components/main/CartPill';
import OfferCarousel from '../../components/main/OfferCarousel';

export default function HomeContent({navigation}) {
  const pageReady = usePageReady();
  const {width} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const address = useSelector(state => state.Auth.deliveryAddress);
  const deliveryLocation = useSelector(state => state.Auth.location);
  const locationId = useSelector(state => state.Auth.locationId);
  const [query, setQuery] = useState('');
  const [liveCategories, setLiveCategories] = useState(null);
  const [liveBanners, setLiveBanners] = useState([]);
  const [bannerIndex, setBannerIndex] = useState(0);
  useEffect(() => {
    if (!liveCatalogEnabled || !locationId) {
      return;
    }
    let active = true;
    getLiveBanners({locationId})
      .then(rows => active && setLiveBanners(rows))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [locationId]);
  useEffect(() => {
    if (!liveCatalogEnabled) {
      return;
    }
    let active = true;
    getLiveCategories()
      .then(rows => {
        if (active && rows.length) {
          setLiveCategories(rows);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  // Featured items for "Top picks"/"Suggested" — real items from the first
  // live category's first shop, instead of catalog.js's hand-picked deals.
  const [liveFeaturedItems, setLiveFeaturedItems] = useState([]);
  useEffect(() => {
    if (!liveCatalogEnabled || !liveCategories?.length || !locationId) {
      return;
    }
    let active = true;
    getLiveShops({
      categoryId: liveCategories[0].id,
      locationId,
      coordinates: deliveryLocation,
    })
      .then(shops => {
        if (!active || !shops.length) {
          return null;
        }
        return getLiveItems({
          shopItemsTableName: shops[0].shopItemsTableName,
          shopId: shops[0].id,
        });
      })
      .then(items => {
        if (active && items) {
          setLiveFeaturedItems(items);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [liveCategories, deliveryLocation, locationId]);
  const [liveSearchResults, setLiveSearchResults] = useState(null);
  useEffect(() => {
    if (!liveCatalogEnabled) {
      return;
    }
    const term = query.trim();
    if (!term) {
      setLiveSearchResults(null);
      return;
    }
    let active = true;
    const timeout = setTimeout(() => {
      searchAll(term, locationId)
        .then(rows => {
          if (active) {
            setLiveSearchResults(
              rows.filter(r => r.kind === 'item').map(r => r.product),
            );
          }
        })
        .catch(() => active && setLiveSearchResults([]));
    }, 300);
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [query, locationId]);
  const contentWidth = width - 32;
  const bannerAspectRatio = 546 / 162;
  const productWidth = (contentWidth - 20) / 3;
  const iconWidth = Math.min((contentWidth - 32) / 5, 72);
  const suggested = (liveSearchResults ?? liveFeaturedItems).slice(
    0,
    query ? 18 : 6,
  );
  const openCategory = id =>
    navigation.navigate('CategoryDetails', {
      categoryId: id,
      selectionRequest: Date.now(),
    });
  const homeCategories = [
    ...(liveCategories || []).slice(0, 9),
    {id: 'more', name: 'More', art: moreArtwork},
  ];
  const deals = liveFeaturedItems.slice(0, 10).map(item => ({
    title: item.name,
    caption:
      item.originalPrice > item.price
        ? `Save ${Math.round((1 - item.price / item.originalPrice) * 100)}%`
        : item.unit,
    art: item.art,
    categoryId: item.categoryId,
    productId: item.id,
    liveItem: item,
  }));
  const promoStyles = [
    {colors: ['#EFF8E9', '#D9ECCD'], ink: '#245A32'},
    {colors: ['#F1EDFF', '#DED6FA'], ink: '#37326E'},
  ];
  const promos = (liveCategories || []).slice(0, 2).map((category, index) => ({
    ...promoStyles[index],
    id: category.id,
    art: {source: category.art.source, resizeMode: 'contain'},
    eyebrow: 'EXPLORE',
    title: category.name,
  }));
  return (
    <Page style={{paddingTop: 0}}>
      <ScrollView
        style={{flex: 1, marginTop: insets.top}}
        stickyHeaderIndices={[1]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 12,
          paddingBottom: 78,
        }}>
        <View style={styles.header}>
          <Pressable
            style={styles.address}
            onPress={() => navigation.navigate('AddressList')}
            accessibilityRole="button"
            accessibilityLabel="Change delivery address">
            <View style={styles.addressTitle}>
              <Text style={styles.deliver}>Deliver to </Text>
              <Text style={styles.home}>{address?.address_type || 'Home'}</Text>
              <MaterialIcons
                name="arrow-drop-down"
                size={24}
                color={colors.ink}
              />
            </View>
            <Text numberOfLines={1} style={styles.addressLine}>
              {address?.full_address || 'Choose your delivery address'}
            </Text>
          </Pressable>
          <Pressable
            style={styles.wishlist}
            onPress={() => navigation.navigate('Wishlist')}
            accessibilityRole="button"
            accessibilityLabel="Wishlist">
            <MaterialIcons name="favorite-border" size={24} color="#555555" />
          </Pressable>
        </View>
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder="Search here"
          style={styles.search}
          onPress={() => navigation.navigate('Search')}
        />
        {liveBanners.length > 0 && (
          <View style={styles.mainBanner}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={e =>
                setBannerIndex(
                  Math.round(e.nativeEvent.contentOffset.x / contentWidth),
                )
              }>
              {liveBanners.map(banner => (
                <Pressable
                  key={banner.id}
                  disabled={!banner.categoryId}
                  onPress={() => openCategory(banner.categoryId)}
                  accessibilityRole="button"
                  accessibilityLabel={banner.title || 'Offer banner'}>
                  <Image
                    source={{uri: banner.uri}}
                    resizeMode="cover"
                    style={{
                      width: contentWidth,
                      height: contentWidth / bannerAspectRatio,
                      borderRadius: 13,
                    }}
                  />
                </Pressable>
              ))}
            </ScrollView>
            {liveBanners.length > 1 && (
              <View style={styles.bannerDots}>
                {liveBanners.map((banner, index) => (
                  <View
                    key={banner.id}
                    style={[
                      styles.bannerDot,
                      index === bannerIndex && styles.bannerDotActive,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        )}
        <View style={styles.categoryGrid}>
          {homeCategories.map(item => (
            <Pressable
              key={item.id}
              style={styles.category}
              onPress={() =>
                item.id === 'more'
                  ? navigation.navigate('CategoriesTab')
                  : openCategory(item.id)
              }
              accessibilityRole="button"
              accessibilityLabel={`Browse ${item.name}`}>
              <ReferenceArtwork
                art={item.art}
                width={iconWidth}
                height={iconWidth}
                resizeMode={item.art.resizeMode}
                style={{borderRadius: 15}}
              />
              <Text style={styles.categoryName}>
                {item.shortName || item.name}
              </Text>
            </Pressable>
          ))}
        </View>
        {promos.length > 0 && (
        <View style={styles.promos}>
          {promos.map(item => {
            const promoWidth = (contentWidth - 10) / 2;
            const promoHeight = 92;
            return (
              <Pressable
                key={item.id}
                style={[
                  styles.promoCard,
                  {width: promoWidth, height: promoHeight},
                  pageReady && styles.surfaceShadow,
                ]}
                onPress={() => openCategory(item.id)}
                accessibilityRole="button"
                accessibilityLabel={`Explore ${item.title.replace('\n', ' ')}`}>
                <LinearGradient
                  colors={item.colors}
                  style={StyleSheet.absoluteFillObject}
                />
                <ReferenceArtwork
                  art={item.art}
                  width={promoHeight - 20}
                  height={promoHeight - 20}
                  resizeMode="contain"
                  style={[
                    styles.promoPhoto,
                    {width: promoHeight - 20, height: promoHeight - 20},
                  ]}
                />
                <View pointerEvents="none" style={styles.promoCopy}>
                  <Text style={[styles.promoEyebrow, {color: item.ink}]}>
                    {item.eyebrow}
                  </Text>
                  <Text style={[styles.promoTitle, {color: item.ink}]}>
                    {item.title}
                  </Text>
                  <View style={styles.promoAction}>
                    <Text style={[styles.promoActionText, {color: item.ink}]}>
                      Shop now
                    </Text>
                    <MaterialIcons
                      name="arrow-forward"
                      size={13}
                      color={item.ink}
                    />
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
        )}
        <LinearGradient colors={['#F2EAFE', '#C39DFA']} style={styles.deals}>
          <Text style={[ui.sectionTitle, styles.dealsTitle]}>
            Top Deals for you!
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{gap: 9}}>
            {deals.map(deal => (
              <Pressable
                key={deal.title}
                onPress={() =>
                  deal.productId
                    ? navigation.navigate('ProductDetails', {
                        productId: deal.productId,
                        liveProduct: deal.liveItem,
                      })
                    : openCategory(deal.categoryId)
                }
                style={[styles.deal, {width: contentWidth * 0.28}]}
                accessibilityRole="button"
                accessibilityLabel={deal.title}>
                <ReferenceArtwork
                  art={deal.art}
                  width={contentWidth * 0.28 - 10}
                  height={contentWidth * 0.28 - 10}
                  style={{borderRadius: 10}}
                />
                <Text numberOfLines={1} style={styles.dealName}>
                  {deal.title}
                </Text>
                <Text numberOfLines={2} style={styles.dealCaption}>
                  {deal.caption}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </LinearGradient>
        {liveBanners.length > 0 && (
          <OfferCarousel
            navigation={navigation}
            offers={liveBanners.map(banner => ({
              id: banner.id,
              categoryId: banner.categoryId,
              title: banner.title,
              source: {uri: banner.uri},
              background: '#EAF1FC',
              imageOnly: true,
            }))}
          />
        )}
        <Text style={[ui.sectionTitle, styles.suggestedTitle]}>
          Suggested for you
        </Text>
        <View style={styles.products}>
          {suggested.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              width={productWidth}
              variant="suggested"
              navigation={navigation}
            />
          ))}
        </View>
        {!suggested.length ? (
          <EmptyState message="No matching products. Try another search." />
        ) : null}
      </ScrollView>
      <CartPill navigation={navigation} />
    </Page>
  );
}
const styles = StyleSheet.create({
  headerBackground: {position: 'absolute', top: 0, left: 0, right: 0},
  header: {
    paddingHorizontal: 16,
    paddingBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  address: {flex: 1},
  addressTitle: {flexDirection: 'row', alignItems: 'center'},
  deliver: {fontSize: 13, color: colors.ink},
  home: {fontSize: 16, fontWeight: '700', color: colors.ink},
  addressLine: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink,
    maxWidth: '78%',
  },
  wishlist: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  search: {marginHorizontal: 16},
  mainBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    borderRadius: 13,
    overflow: 'hidden',
    backgroundColor: '#EAF1FC',
  },
  bannerDots: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    flexDirection: 'row',
  },
  bannerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  bannerDotActive: {backgroundColor: '#FFFFFF'},
  categoryGrid: {paddingHorizontal: 10, flexDirection: 'row', flexWrap: 'wrap'},
  category: {width: '20%', alignItems: 'center', marginBottom: 8},
  categoryName: {
    fontSize: 10,
    lineHeight: 13,
    textAlign: 'center',
    color: colors.ink,
    marginTop: 5,
    paddingHorizontal: 2,
  },
  promos: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  promoCard: {
    borderRadius: 14,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  surfaceShadow: {
    elevation: 2,
    shadowColor: '#252744',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: {width: 0, height: 2},
  },
  promoPhoto: {
    position: 'absolute',
    right: 8,
    top: 10,
    resizeMode: 'contain',
  },
  promoCopy: {
    width: '62%',
    paddingHorizontal: 10,
    paddingVertical: 9,
    zIndex: 1,
  },
  promoEyebrow: {
    fontSize: 8,
    lineHeight: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  promoTitle: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '700',
  },
  promoAction: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginTop: 5,
  },
  promoActionText: {fontSize: 9, lineHeight: 12, fontWeight: '700'},
  deals: {
    marginHorizontal: 16,
    padding: 10,
    paddingBottom: 11,
    borderRadius: 22,
    marginBottom: 14,
  },
  dealsTitle: {fontSize: 16, marginBottom: 8},
  deal: {padding: 5, backgroundColor: '#FFFFFF', borderRadius: 15},
  dealName: {fontSize: 10, color: '#777777', marginTop: 6},
  dealCaption: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.ink,
    marginTop: 3,
  },
  suggestedTitle: {marginHorizontal: 16, marginBottom: 10},
  products: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 10,
    rowGap: 12,
  },
});
