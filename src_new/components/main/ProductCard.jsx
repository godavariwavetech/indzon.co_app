import {Text} from '../Typography';
import React, {useRef} from 'react';
import {Animated, Pressable, StyleSheet, View} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import ReferenceArtwork from './ReferenceArtwork';
import {
  addItem,
  removeItem,
  toggleWishlist,
} from '../../redux/reducers/commerce';
import {money} from '../../config/catalog';
import {colors} from './MainUi';
import {toggleLiveWishlist} from '../../services/catalogService';

function ProductCard({product, width, navigation, variant = 'compact'}) {
  const categoryGrid = variant === 'categoryGrid';
  const detailed = variant === 'detailed' || variant === 'wishlist' || categoryGrid;
  const suggested = variant === 'suggested';
  const wishlistCard = variant === 'wishlist';
  const imageScale = useRef(new Animated.Value(1)).current;
  const animateImage = toValue =>
    Animated.spring(imageScale, {
      toValue,
      damping: 18,
      stiffness: 260,
      mass: 0.65,
      useNativeDriver: true,
    }).start();
  const dispatch = useDispatch();
  const quantity = useSelector(state => state.commerce.cart[product.id] || 0);
  const wished = useSelector(state =>
    state.commerce.wishlist.includes(product.id),
  );
  const customerId = useSelector(state => state.Auth.customerId);
  const locationId = useSelector(state => state.Auth.locationId);
  const discount = Math.round(
    (1 - product.price / product.originalPrice) * 100,
  );
  return (
    <View style={[{width}, categoryGrid && styles.catalogCard]}>
      <View
        style={[
          styles.picture,
          detailed && styles.detailedPicture,
          suggested && styles.suggestedPicture,
          categoryGrid && styles.catalogPicture,
        ]}>
        <Animated.View style={{transform: [{scale: imageScale}]}}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`View ${product.name}`}
            onPress={() =>
              navigation.navigate('ProductDetails', {
                productId: product.id,
                // Live items have no single-item fetch endpoint — hand the
                // already-fetched object through instead of looking it up.
                liveProduct: product,
              })
            }
            onPressIn={() => animateImage(0.975)}
            onPressOut={() => animateImage(1)}
            android_ripple={{color: '#3832FF12'}}>
            <ReferenceArtwork
              art={product.art}
              width={detailed ? width - 18 : width}
              height={detailed ? width * 0.96 : width * 1.16}
              resizeMode={
                categoryGrid ? 'contain' : product.art.resizeMode ||
                (detailed || suggested ? 'cover' : 'contain')
              }
              style={[
                {borderRadius: 10},
                detailed && {
                  marginHorizontal: 8,
                  marginTop: 9,
                  marginBottom: 28,
                },
                categoryGrid && {marginTop: 5, marginBottom: 25},
              ]}
            />
          </Pressable>
        </Animated.View>
        <Pressable
          onPress={() => {
            dispatch(toggleWishlist(product.id));
            if (customerId) {
              toggleLiveWishlist({
                customerId,
                locationId,
                item: product,
                wished: !wished,
              }).catch(
                () => {},
              );
            }
          }}
          style={[styles.heart, categoryGrid && {top: 4, right: 4, width: 23, height: 23}]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`${wished ? 'Remove' : 'Add'} ${product.name} ${
            wished ? 'from' : 'to'
          } wishlist`}
          accessibilityState={{selected: wished}}>
          <MaterialIcons
            name={wished ? 'favorite' : 'favorite-border'}
            size={categoryGrid ? 17 : detailed ? 23 : 19}
            color={wished ? '#FF0000' : colors.muted}
          />
        </Pressable>
        {detailed && !categoryGrid && product.bestseller ? (
          <Text style={styles.bestseller}>Bestseller</Text>
        ) : null}
        {product.rating ? (
          <View
            style={[
              styles.rating,
              detailed && {left: 8, bottom: 9},
              suggested && styles.suggestedRating,
              categoryGrid && {left: 4, bottom: 5, paddingHorizontal: 2, paddingVertical: 3, alignItems: 'center', gap: 1},
            ]}>
            <MaterialIcons
              name="star"
              size={categoryGrid ? 12 : detailed ? 19 : 12}
              color="#009A5D"
            />
            <Text
              style={[
                styles.ratingText,
                detailed && {fontSize: 16},
                suggested && {fontSize: 12, lineHeight: 16},
                categoryGrid && {fontSize: 11},
              ]}>
              {product.rating}
            </Text>
          </View>
        ) : null}
        {wishlistCard ? null : quantity ? (
          <View
            style={[
              styles.quantity,
              detailed && {height: 30, minWidth: 72, right: 7, bottom: 7},
              categoryGrid && {right: 4, bottom: 4, minWidth: 52, height: 24, backgroundColor: '#FFFFFF', borderRadius: 6, paddingHorizontal: 3, gap: 2},
            ]}>
            <Pressable
              onPress={() => dispatch(removeItem(product.id))}
              accessibilityRole="button"
              accessibilityLabel={`Remove one ${product.name}`}
              hitSlop={4}>
              <Text style={styles.quantityText}>−</Text>
            </Pressable>
            <Text style={styles.quantityText}>{quantity}</Text>
            <Pressable
              onPress={() => dispatch(addItem(product.id))}
              accessibilityRole="button"
              accessibilityLabel={`Add one ${product.name}`}
              hitSlop={4}>
              <Text style={styles.quantityText}>+</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={[
              styles.add,
              suggested && styles.suggestedAdd,
              detailed && {
                paddingHorizontal: 12,
                paddingVertical: 5,
                bottom: 7,
                right: 7,
                borderRadius: 8,
              },
              categoryGrid && {right: 4, bottom: 4, alignItems: 'center', minWidth: 40, height: 24, justifyContent: 'center', paddingHorizontal: 7, paddingVertical: 0, backgroundColor: '#FFFFFF', borderColor: colors.primary, borderRadius: 6},
            ]}
            onPress={() => dispatch(addItem(product.id))}
            accessibilityRole="button"
            accessibilityLabel={`Add ${product.name} to cart`}>
            <Text
              style={[
                styles.addText,
                detailed && {fontSize: 14},
                suggested && {fontSize: 12, lineHeight: 16},
                categoryGrid && {fontSize: 11, lineHeight: 14},
              ]}>
              ADD
            </Text>
          </Pressable>
        )}
      </View>
      <Text
        numberOfLines={1}
        style={[
          styles.name,
          detailed && {fontSize: 15, marginTop: 3},
          suggested && styles.suggestedName,
          categoryGrid && {fontSize: 13, lineHeight: 17, marginTop: 2},
        ]}>
        {product.name}
      </Text>
      {detailed ? (
        <Text numberOfLines={1} style={[styles.subtitle, categoryGrid && {fontSize: 11, lineHeight: 15, marginTop: 2}]}>
          {product.description}
        </Text>
      ) : null}
      <View
        style={[
          styles.prices,
          detailed && {flexWrap: 'wrap'},
          suggested && {marginTop: 2, gap: 4},
          categoryGrid && {gap: 3, marginTop: 3, minHeight: 18},
        ]}>
        <Text
          style={[
            styles.price,
            detailed && {fontSize: 17},
            suggested && styles.suggestedPrice,
            categoryGrid && {fontSize: 14},
          ]}>
          {money(product.price)}
        </Text>
        <Text
          style={[
            styles.oldPrice,
            detailed && {fontSize: 12},
            suggested && {fontSize: 10, lineHeight: 19},
            categoryGrid && {fontSize: 10},
          ]}>
          {money(product.originalPrice)}
        </Text>
        {detailed && !categoryGrid ? <Text style={styles.discount}>↓ {discount}%</Text> : null}
        {categoryGrid && discount > 0 ? <Text style={styles.catalogDiscount}>↓ {discount}%</Text> : null}
      </View>
      {!detailed ? (
        <Text
          style={[
            styles.discount,
            suggested && {fontSize: 12, lineHeight: 17, marginTop: 2},
          ]}>
          {discount}% OFF
        </Text>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  catalogCard: {
    paddingBottom: 2,
  },
  catalogPicture: {borderWidth: 1, borderColor: '#DDDDEA', borderRadius: 10, backgroundColor: '#FFFFFF', marginBottom: 5},
  catalogDiscount: {fontSize: 10, fontWeight: '700', color: '#0057FF'},
  picture: {position: 'relative', marginBottom: 6},
  suggestedPicture: {
    backgroundColor: '#F5F6F8',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 7,
  },
  suggestedRating: {
    bottom: 4,
    left: 4,
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 3,
    gap: 2,
    borderRadius: 4,
  },
  suggestedAdd: {
    right: 3,
    bottom: 3,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 0,
    paddingHorizontal: 9,
    borderRadius: 8,
  },
  suggestedName: {fontSize: 12, lineHeight: 17, fontWeight: '600'},
  suggestedPrice: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  detailedPicture: {
    borderWidth: 1,
    borderColor: '#D3D8E5',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  subtitle: {fontSize: 13, lineHeight: 18, color: colors.muted, marginTop: 5},
  bestseller: {
    position: 'absolute',
    left: 0,
    top: 0,
    backgroundColor: colors.primary,
    color: '#FFFFFF',
    paddingHorizontal: 7,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: '600',
    borderBottomRightRadius: 8,
  },
  heart: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rating: {
    position: 'absolute',
    left: 4,
    bottom: 5,
    flexDirection: 'row',
    gap: 2,
    backgroundColor: '#FFFFFFE6',
    borderRadius: 4,
    paddingHorizontal: 3,
    paddingVertical: 2,
  },
  ratingText: {fontSize: 11, color: colors.ink, fontWeight: '600'},
  add: {
    position: 'absolute',
    right: 3,
    bottom: 4,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  addText: {color: colors.primary, fontSize: 11, fontWeight: '700'},
  quantity: {
    position: 'absolute',
    right: 2,
    bottom: 4,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
    borderRadius: 7,
    paddingHorizontal: 4,
    minWidth: 52,
    height: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 3,
  },
  quantityText: {color: colors.primary, fontSize: 12, fontWeight: '700'},
  name: {fontSize: 11, color: colors.ink, fontWeight: '600'},
  prices: {flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3},
  price: {fontSize: 13, fontWeight: '700', color: colors.ink},
  oldPrice: {fontSize: 9, color: '#777777', textDecorationLine: 'line-through'},
  discount: {fontSize: 11, fontWeight: '700', color: '#0057FF', marginTop: 4},
});

export default React.memo(ProductCard);
