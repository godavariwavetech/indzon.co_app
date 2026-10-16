import {Text} from '../../components/Typography';
import React, {useState} from 'react';
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
import {artwork, categories, moreArtwork, products} from '../../config/catalog';
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
  const [query, setQuery] = useState('');
  const contentWidth = width - 32;
  const productWidth = (contentWidth - 20) / 3;
  const iconWidth = Math.min((contentWidth - 32) / 5, 72);
  const suggested = products
    .filter(
      item =>
        !query.trim() ||
        item.name.toLowerCase().includes(query.trim().toLowerCase()),
    )
    .slice(0, query ? 18 : 6);
  const openCategory = id =>
    navigation.navigate('CategoryDetails', {
      categoryId: id,
      selectionRequest: Date.now(),
    });
  const homeCategories = [
    ...categories.slice(0, 9),
    {id: 'more', name: 'More', art: moreArtwork},
  ];
  const deals = [
    {
      title: 'Women Dresses',
      caption: 'Deals for you!',
      art: artwork.dressDeal,
      categoryId: 'fashion',
    },
    {
      title: 'Men Watches',
      caption: 'Starting From 199',
      art: artwork.watchDeal,
      categoryId: 'electronics',
    },
    {
      title: 'Groceries',
      caption: 'Deals for you!',
      art: artwork.cerealDeal,
      categoryId: 'grocery',
    },
    ...['shoes', 'luggage', 'kitkat', 'sambar', 'rice', 'eggs', 'salt'].map(
      id => {
        const product = products.find(item => item.id === id);
        return {
          title: product.name,
          caption: `Save ${Math.round(
            (1 - product.price / product.originalPrice) * 100,
          )}%`,
          art: product.art,
          categoryId: product.categoryId,
          productId: product.id,
        };
      },
    ),
  ];
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
        <Pressable
          style={[styles.mainBanner, pageReady && styles.surfaceShadow]}
          onPress={() => openCategory('grocery')}
          accessibilityRole="button"
          accessibilityLabel="Shop grocery savings">
          <ReferenceArtwork
            art={artwork.banner}
            width={contentWidth}
            height={contentWidth / artwork.banner.aspectRatio}
            style={{borderRadius: 13}}
          />
        </Pressable>
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
        <View style={styles.promos}>
          {[
            {
              art: artwork.groceryPromo,
              id: 'grocery',
              eyebrow: 'FRESH EVERY DAY',
              title: 'Groceries,\nmade simple.',
              colors: ['#EFF8E9', '#D9ECCD'],
              ink: '#245A32',
            },
            {
              art: artwork.electronicsPromo,
              id: 'electronics',
              eyebrow: 'SMARTER PICKS',
              title: 'Upgrade your\neveryday tech.',
              colors: ['#F1EDFF', '#DED6FA'],
              ink: '#37326E',
            },
          ].map(item => {
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
                  width={promoWidth}
                  height={promoHeight}
                  resizeMode="cover"
                  style={[
                    styles.promoPhoto,
                    {width: promoWidth, height: promoHeight},
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
        <OfferCarousel navigation={navigation} />
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
    backgroundColor: '#EAF1FC',
  },
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
    right: 0,
    top: 0,
    resizeMode: 'cover',
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
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
