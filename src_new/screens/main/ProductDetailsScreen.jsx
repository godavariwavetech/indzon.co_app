import ReferenceArtwork from '../../components/main/ReferenceArtwork';
import React, {useEffect, useRef, useState} from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import {Text} from '../../components/Typography';
import GradientButton from '../../components/main/GradientButton';
import LinearGradient from 'react-native-linear-gradient';
import {useDispatch, useSelector} from 'react-redux';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {money} from '../../config/catalog';
import {getLiveItems} from '../../services/catalogService';
import {
  addItem,
  removeItem,
  toggleWishlist,
} from '../../redux/reducers/commerce';
import {Page, EmptyState, Heading} from '../../components/main/MainUi';

const blue = '#3832FF';
const green = '#00AD49';
// Uses the app's shared typography scale so text sizes match the other screens.
// Dimensions below follow the 393 pt source design.
function Label({style, ...props}) {
  return (
    <Text {...props} allowFontScaling={false} style={[styles.text, style]} />
  );
}

function Quantity({product, quantity, scale}) {
  const dispatch = useDispatch();
  return (
    <LinearGradient
      colors={['#4B43FF', '#173CFF']}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 0}}
      style={[styles.quantity, {height: 40 * scale}]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Remove one ${product.name}`}
        onPress={() => dispatch(removeItem(product.id))}
        style={styles.quantityButton}>
        <Label style={styles.quantityText}>−</Label>
      </Pressable>
      <Label style={styles.quantityText}>{quantity}</Label>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Add one ${product.name}`}
        onPress={() => dispatch(addItem(product.id))}
        style={styles.quantityButton}>
        <Label style={styles.quantityText}>+</Label>
      </Pressable>
    </LinearGradient>
  );
}

function RelatedProduct({product, navigation, scale}) {
  const dispatch = useDispatch();
  const wished = useSelector(state =>
    state.commerce.wishlist.includes(product.id),
  );
  const quantity = useSelector(state => state.commerce.cart[product.id] || 0);
  const discount = Math.round(
    (1 - product.price / product.originalPrice) * 100,
  );
  return (
    <View style={{width: 132 * scale}}>
      <View style={[styles.relatedPicture, {height: 144 * scale}]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`View ${product.name}`}
          onPress={() =>
            navigation.push('ProductDetails', {productId: product.id})
          }>
          <ReferenceArtwork art={product.art} width={130 * scale} height={132 * scale} resizeMode="contain" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${wished ? 'Remove from' : 'Add to'} wishlist`}
          accessibilityState={{selected: wished}}
          onPress={() => dispatch(toggleWishlist(product.id))}
          style={styles.relatedHeart}
          hitSlop={6}>
          <MaterialIcons
            name={wished ? 'favorite' : 'favorite-border'}
            size={20 * scale}
            color={wished ? '#ED4242' : '#65717B'}
          />
        </Pressable>
        <View style={styles.relatedRating}>
          <MaterialIcons name="star" size={18 * scale} color="#009A62" />
          <Label style={{fontSize: 14 * scale, fontWeight: '700'}}>
            {product.rating}
          </Label>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Add ${product.name} to cart`}
          onPress={() => dispatch(addItem(product.id))}
          style={styles.relatedAdd}>
          <Label style={{color: blue, fontSize: 12 * scale, fontWeight: '700'}}>
            {quantity ? `${quantity} +` : 'ADD'}
          </Label>
        </Pressable>
      </View>
      <Label
        numberOfLines={1}
        style={{fontSize: 14 * scale, fontWeight: '600', marginTop: 5 * scale}}>
        {product.name}
      </Label>
      <Label
        numberOfLines={1}
        style={{fontSize: 12 * scale, color: '#7B8294', marginTop: 6 * scale}}>
        {product.description}
      </Label>
      <View style={[styles.priceRow, {gap: 4 * scale, marginTop: 5 * scale}]}>
        <Label style={{fontSize: 15 * scale, fontWeight: '700'}}>
          {money(product.price)}
        </Label>
        <Label style={[styles.strike, {fontSize: 11 * scale}]}>
          {money(product.originalPrice)}
        </Label>
        <Label
          style={{fontSize: 11 * scale, color: '#0057FF', fontWeight: '700'}}>
          ↓{discount}%
        </Label>
      </View>
    </View>
  );
}

function Details({product, navigation}) {
  const {width} = useWindowDimensions();
  const scale = Math.min(width / 393, 1.4);
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const quantity = useSelector(state => state.commerce.cart[product.id] || 0);
  const wished = useSelector(state =>
    state.commerce.wishlist.includes(product.id),
  );
  const [expanded, setExpanded] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const gallery = useRef(null);
  const images = product.images?.length
    ? product.images.map(source => ({source, zoom: 1, label: 'Product image'}))
    : [
        {source: product.art.source, zoom: 1, label: 'Full view'},
        {source: product.art.source, zoom: 1.45, label: 'Close-up'},
        {source: product.art.source, zoom: 1.9, label: 'Detail view'},
      ];
  const information = [
    ...(product.brand ? [['Brand', product.brand]] : []),
    ['Category', product.categoryName],
    ['Product type', product.subcategoryName],
    ['Pack size', product.unit],
    ['Selling price', money(product.price)],
    ['Maximum retail price', money(product.originalPrice)],
    [
      'You save',
      `${money(product.originalPrice - product.price)} (${Math.round(
        (1 - product.price / product.originalPrice) * 100,
      )}%)`,
    ],
    ...(product.vegetarian ? [['Dietary preference', 'Vegetarian']] : []),
  ].filter(([, value]) => Boolean(value));
  const [similar, setSimilar] = useState([]);
  useEffect(() => {
    if (!product.shopItemsTableName) {
      return undefined;
    }
    let active = true;
    getLiveItems({
      shopItemsTableName: product.shopItemsTableName,
      shopId: product.shopId,
    })
      .then(rows => {
        if (!active) {
          return;
        }
        setSimilar(
          rows
            .filter(item => item.id !== product.id)
            .sort(
              (a, b) =>
                Number(b.subcategoryId === product.subcategoryId) -
                Number(a.subcategoryId === product.subcategoryId),
            )
            .slice(0, 6),
        );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [product.id, product.shopId, product.shopItemsTableName, product.subcategoryId]);
  const weight = product.unit.match(/^([\d.]+)\s*(kg|g)$/i);
  const per100 = weight
    ? product.price /
      (Number(weight[1]) * (weight[2].toLowerCase() === 'kg' ? 10 : 0.01))
    : null;
  return (
    <Page style={styles.page}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: 40 * scale}}>
        <View style={{height: 358 * scale}}>
          <ScrollView
            ref={gallery}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={event =>
              setImageIndex(
                Math.round(event.nativeEvent.contentOffset.x / width),
              )
            }
            style={{
              position: 'absolute',
              top: 14 * scale,
              height: 300 * scale,
            }}>
            {images.map((image, index) => (
              <View
                key={index}
                style={{width, alignItems: 'center', overflow: 'hidden'}}>
                {product.art.sprite && !product.images?.length ? (
                  <ReferenceArtwork art={product.art} width={width - 16 * scale} height={300 * scale} style={{transform: [{scale: image.zoom}]}} />
                ) : <Image
                  source={image.source}
                  accessibilityLabel={product.name + ': ' + image.label}
                  resizeMode="contain"
                  style={{
                    width: width - 16 * scale,
                    height: 300 * scale,
                    transform: [{scale: image.zoom}],
                  }}
                />}
              </View>
            ))}
          </ScrollView>
          <View
            style={[
              styles.navigation,
              {top: 14 * scale, left: 16 * scale, right: 16 * scale},
            ]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={() => navigation.goBack()}
              hitSlop={10}
              style={styles.back}>
              <MaterialIcons
                name="arrow-back"
                size={26 * scale}
                color="#0D0D0D"
              />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                wished ? 'Remove from wishlist' : 'Add to wishlist'
              }
              accessibilityState={{selected: wished}}
              onPress={() => dispatch(toggleWishlist(product.id))}
              style={[styles.heart, {width: 32 * scale, height: 32 * scale}]}>
              <MaterialIcons
                name={wished ? 'favorite' : 'favorite-border'}
                size={23 * scale}
                color={wished ? '#ED4242' : '#4E4E4E'}
              />
            </Pressable>
          </View>
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              bottom: 34 * scale,
              alignSelf: 'center',
              backgroundColor: '#FFFFFFE6',
              borderRadius: 12,
              paddingHorizontal: 10,
              paddingVertical: 5,
            }}>
            <Label style={{fontSize: 11 * scale, color: '#64707C'}}>
              {images[imageIndex]?.label} · {imageIndex + 1}/{images.length}
            </Label>
          </View>
          <View style={[styles.dots, {left: 20 * scale, bottom: 11 * scale}]}>
            {images.map((_, index) => (
              <Pressable
                key={index}
                accessibilityRole="button"
                accessibilityLabel={`View product image ${index + 1}`}
                accessibilityState={{selected: imageIndex === index}}
                hitSlop={8}
                onPress={() => {
                  gallery.current?.scrollTo({x: index * width, animated: true});
                  setImageIndex(index);
                }}
                style={{
                  width: (imageIndex === index ? 6 : 4) * scale,
                  height: (imageIndex === index ? 6 : 4) * scale,
                  borderRadius: 4,
                  backgroundColor: imageIndex === index ? blue : '#717171',
                }}
              />
            ))}
          </View>
          <View
            style={[
              styles.rating,
              {
                right: 8 * scale,
                height: 28 * scale,
                paddingHorizontal: 7 * scale,
              },
            ]}
            accessibilityLabel={`${product.rating} stars${
              product.reviewCount ? `, ${product.reviewCount} reviews` : ''
            }`}>
            {[0, 1, 2, 3, 4].map(index => (
              <MaterialIcons
                key={index}
                name={
                  Number(product.rating) >= index + 1
                    ? 'star'
                    : Number(product.rating) > index
                    ? 'star-half'
                    : 'star-border'
                }
                size={12 * scale}
                color="#F2BC00"
              />
            ))}
            <Label style={{fontSize: 10 * scale, marginLeft: 4 * scale}}>
              {product.reviewCount
                ? `(${product.reviewCount.toLocaleString('en-IN')})`
                : product.rating}
            </Label>
          </View>
        </View>
        <View
          style={[
            styles.panel,
            {marginHorizontal: 8 * scale, padding: 12 * scale},
          ]}>
          <View style={styles.titleRow}>
            <Label
              style={{
                fontSize: 16 * scale,
                lineHeight: 19 * scale,
                fontWeight: '700',
                flex: 1,
              }}>
              {product.name}
            </Label>
            {product.vegetarian ? (
              <View accessibilityLabel="Vegetarian" style={styles.veg}>
                <View style={styles.vegDot} />
              </View>
            ) : null}
          </View>
          <Label
            style={[
              styles.description,
              {
                fontSize: 14 * scale,
                lineHeight: 18 * scale,
                marginTop: 7 * scale,
              },
            ]}>
            {product.description}
          </Label>
          <Label
            style={[
              styles.description,
              {fontSize: 14 * scale, marginTop: 7 * scale},
            ]}>
            {product.unit}
          </Label>
          <View style={[styles.priceRow, {marginTop: 7 * scale}]}>
            <Label style={{fontSize: 16 * scale, fontWeight: '700'}}>
              {money(product.price)}
            </Label>
            <Label style={[styles.strike, {fontSize: 14 * scale}]}>
              MRP {money(product.originalPrice)}
            </Label>
          </View>
          {per100 !== null ? (
            <Label
              style={[
                styles.description,
                {fontSize: 14 * scale, marginTop: 7 * scale},
              ]}>
              ₹{per100.toFixed(2)}/100 g
            </Label>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityState={{expanded}}
            onPress={() => setExpanded(!expanded)}
            style={[
              styles.detailsToggle,
              {
                paddingTop: 11 * scale,
                marginTop: 9 * scale,
                paddingBottom: 3 * scale,
              },
            ]}>
            <Label
              style={{fontSize: 14 * scale, color: green, fontWeight: '700'}}>
              View Product Details
            </Label>
            <MaterialIcons
              name={expanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
              size={22 * scale}
              color={green}
            />
          </Pressable>
          {expanded ? (
            <View style={styles.expandedDetails}>
              <Label style={styles.detailsHeading}>About this product</Label>
              <Label style={styles.detailsBody}>{product.description}</Label>
              <Label style={styles.detailsHeading}>Product information</Label>
              {information.map(([label, value]) => (
                <View key={label} style={styles.informationRow}>
                  <Label style={styles.informationLabel}>{label}</Label>
                  <Label style={styles.informationValue}>{value}</Label>
                </View>
              ))}
              <Label style={styles.detailsHeading}>Storage & care</Label>
              <Label style={styles.detailsBody}>
                {['grocery', 'produce', 'food'].includes(product.categoryId)
                  ? 'Follow the storage instructions and use-by date on the pack. Refer to the label for the full ingredients and allergen information.'
                  : 'Refer to the product packaging for specifications, care instructions and any applicable warranty information.'}
              </Label>
            </View>
          ) : null}
        </View>
        {similar.length ? (
          <View
            style={[
              styles.similar,
              {
                marginHorizontal: 8 * scale,
                marginTop: 16 * scale,
                paddingVertical: 12 * scale,
              },
            ]}>
            <Label
              style={{
                fontSize: 16 * scale,
                fontWeight: '700',
                marginHorizontal: 12 * scale,
                marginBottom: 13 * scale,
              }}>
              Similar Products
            </Label>
            <ScrollView
              key={product.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 12 * scale,
                gap: 12 * scale,
              }}>
              {similar.map(item => (
                <RelatedProduct
                  key={item.id}
                  product={item}
                  navigation={navigation}
                  scale={scale}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}
      </ScrollView>
      <View
        style={[
          styles.footer,
          {
            paddingHorizontal: 16 * scale,
            paddingTop: 12 * scale,
            paddingBottom: Math.max(insets.bottom, 16 * scale),
          },
        ]}>
        <View style={{flex: 1}}>
          <Label style={{fontSize: 12 * scale, marginBottom: 4 * scale}}>
            {product.unit}
          </Label>
          <View style={[styles.priceRow, {gap: 5 * scale, flexWrap: 'wrap'}]}>
            <Label style={{fontSize: 22 * scale, fontWeight: '700'}}>
              {money(product.price)}
            </Label>
            <Label style={[styles.strike, {fontSize: 12 * scale}]}>
              MRP {money(product.originalPrice)}
            </Label>
          </View>
          <Label
            style={{
              fontSize: 10 * scale,
              color: '#555555',
              marginTop: 5 * scale,
            }}>
            Inclusive of all taxes
          </Label>
        </View>
        {quantity ? (
          <View style={{width: 132 * scale}}>
            <Quantity product={product} quantity={quantity} scale={scale} />
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('Cart')}>
              <Label style={{textAlign: 'center', color: blue, marginTop: 5}}>
                View cart
              </Label>
            </Pressable>
          </View>
        ) : (
          <GradientButton
            label="Add to cart"
            onPress={() => dispatch(addItem(product.id))}
            height={40 * scale}
            style={{width: 132 * scale}}
          />
        )}
      </View>
    </Page>
  );
}

export default function ProductDetailsScreen({navigation, route}) {
  // Live items have a compound id (shopItemsTableName:itemId) that won't
  // match catalog.js — ProductCard passes the full live object through nav
  // params instead of relying on a lookup-by-id (no single-item API exists).
  const product = route.params?.liveProduct;
  if (!product) {
    return (
      <Page>
        <Heading title="Product Details" back navigation={navigation} />
        <EmptyState message="This product is unavailable." />
      </Page>
    );
  }
  return <Details key={product.id} product={product} navigation={navigation} />;
}

const styles = StyleSheet.create({
  expandedDetails: {paddingTop: 14},
  detailsHeading: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 8,
  },
  detailsBody: {
    fontSize: 13,
    lineHeight: 20,
    color: '#5C6975',
    marginBottom: 8,
  },
  informationRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#ECEEF1',
  },
  informationLabel: {flex: 1, fontSize: 13, lineHeight: 18, color: '#64707C'},
  informationValue: {flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '500'},
  exploreHeading: {
    fontSize: 16,
    fontWeight: '700',
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 10,
  },
  text: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    fontSize: 14,
    color: '#202427',
    includeFontPadding: false,
  },
  page: {backgroundColor: '#F5F5F5'},
  navigation: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  back: {height: 32, justifyContent: 'center'},
  heart: {
    borderRadius: 30,
    backgroundColor: '#EDEDED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    position: 'absolute',
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  rating: {
    position: 'absolute',
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDEDED',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  panel: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDEDED',
    borderRadius: 12,
  },
  titleRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 12},
  veg: {
    borderWidth: 1,
    borderColor: green,
    borderRadius: 4,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegDot: {width: 8, height: 8, borderRadius: 4, backgroundColor: green},
  description: {color: '#5C6975'},
  priceRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  strike: {textDecorationLine: 'line-through', color: '#64707C'},
  detailsToggle: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#BDBDBD',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
  },
  similar: {backgroundColor: '#FFFFFF', borderRadius: 12},
  relatedPicture: {
    borderWidth: 1,
    borderColor: '#E5EAF2',
    borderRadius: 8,
    overflow: 'hidden',
  },
  relatedHeart: {
    position: 'absolute',
    right: 9,
    top: 11,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
  },
  relatedRating: {
    position: 'absolute',
    left: 10,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFFFFDD',
  },
  relatedAdd: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: blue,
    backgroundColor: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: -3},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  addToCart: {
    backgroundColor: blue,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantity: {
    borderRadius: 11,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityButton: {padding: 10},
  quantityText: {color: '#FFFFFF', fontSize: 16, fontWeight: '700'},
});
