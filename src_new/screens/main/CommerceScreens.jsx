import OrderShipment, {
  shipmentStatus,
} from '../../components/main/OrderShipment';
import {useFocusEffect} from '@react-navigation/native';
import SuccessCelebration from '../../components/main/SuccessCelebration';
import {Text, TextInput} from '../../components/Typography';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Modal,
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
import {
  categories,
  money,
  products,
  sampleOrders,
  shops,
} from '../../config/catalog';
import {
  addItem,
  removeItem,
  deleteItem,
  clearCart,
  toggleWishlist,
  placePreviewOrder,
  saveOrderFeedback,
} from '../../redux/reducers/commerce';
import {
  colors,
  EmptyState,
  Footer,
  Heading,
  Page,
  SearchField,
  usePageReady,
  ui,
} from '../../components/main/MainUi';
import ReferenceArtwork from '../../components/main/ReferenceArtwork';
import {LoadingImage as Image} from '../../components/main/Skeleton';
import ProductCard from '../../components/main/ProductCard';
import CartPill from '../../components/main/CartPill';
import {evaluateCoupon} from '../../config/coupons';
import {matchesFilter} from './MainCategoriesScreen';

function IconButton({icon, label, onPress, badge, selected = false}) {
  return (
    <Pressable
      onPress={onPress}
      style={s.iconButton}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{selected}}>
      <MaterialIcons
        name={icon}
        size={25}
        color={selected ? '#FF0000' : '#56616A'}
      />
      {badge > 0 ? <Text style={s.badge}>{badge}</Text> : null}
    </Pressable>
  );
}
function Section({title, children, style, titleStyle}) {
  const pageReady = usePageReady();
  return (
    <View style={[s.section, pageReady && s.sectionShadow, style]}>
      {title ? <Text style={[s.sectionTitle, titleStyle]}>{title}</Text> : null}
      {children}
    </View>
  );
}
function InfoRow({icon, label, value}) {
  return (
    <View style={s.infoRow}>
      <MaterialIcons name={icon} size={23} color={colors.primary} />
      <View style={{flex: 1}}>
        <Text style={s.infoLabel}>{label}</Text>
        <Text style={s.infoValue}>{value}</Text>
      </View>
    </View>
  );
}
function BillRow({label, value, strong = false, blue = false}) {
  return (
    <View style={s.billRow}>
      <Text style={[s.billLabel, strong && s.bold, blue && s.blue]}>
        {label}
      </Text>
      <Text
        style={[
          s.billLabel,
          strong && s.billTotalValue,
          !strong && s.billValue,
          blue && s.blue,
        ]}>
        {value}
      </Text>
    </View>
  );
}
function Quantity({product, quantity}) {
  const dispatch = useDispatch();
  return (
    <View style={s.quantity}>
      <Pressable
        style={s.quantityButton}
        accessibilityRole="button"
        accessibilityLabel={`Remove one ${product.name}`}
        onPress={() => dispatch(removeItem(product.id))}>
        <Text style={s.quantityText}>−</Text>
      </Pressable>
      <Text style={s.quantityText}>{quantity}</Text>
      <Pressable
        style={s.quantityButton}
        accessibilityRole="button"
        accessibilityLabel={`Add one ${product.name}`}
        onPress={() => dispatch(addItem(product.id))}>
        <Text style={s.quantityText}>+</Text>
      </Pressable>
    </View>
  );
}
function Choices({visible, title, options, value, onSelect, onClose}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={s.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFillObject}
          accessibilityRole="button"
          accessibilityLabel="Close options"
          onPress={onClose}
        />
        <View style={[s.sheet, {paddingBottom: Math.max(insets.bottom, 20)}]}>
          <View style={s.row}>
            <Text style={[ui.sectionTitle, {flex: 1}]}>{title}</Text>
            <IconButton icon="close" label="Close options" onPress={onClose} />
          </View>
          {options.map(([id, label]) => (
            <Pressable
              key={id}
              style={s.option}
              accessibilityRole="radio"
              accessibilityState={{selected: value === id}}
              onPress={() => {
                onSelect(id);
                onClose();
              }}>
              <Text style={s.infoValue}>{label}</Text>
              <MaterialIcons
                name={
                  value === id
                    ? 'radio-button-checked'
                    : 'radio-button-unchecked'
                }
                size={22}
                color={colors.primary}
              />
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}

export function CategoriesBrowseScreen(props) {
  return <ProductListScreen {...props} embedded />;
}

export function ProductListScreen({navigation, route, embedded = false}) {
  const {width} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const {
    categoryId = 'grocery',
    subcategoryId,
    filter: initialFilter = 'all',
  } = route.params || {};
  const category = categories.find(item => item.id === categoryId);
  const subcategory = category?.subcategories.find(
    item => item.id === subcategoryId,
  );
  const productScroll = useRef(null);
  const sidebarWidth = 86;
  const productAreaWidth = width - sidebarWidth - 24;
  const productWidth = Math.floor((productAreaWidth - 12) / 2);
  const cart = useSelector(state => state.commerce.cart);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState(initialFilter);
  const [sort, setSort] = useState('recommended');
  const [sheet, setSheet] = useState('');
  useEffect(() => {
    setQuery('');
    setFilter(initialFilter);
    setSort('recommended');
    productScroll.current?.scrollTo({y: 0, animated: false});
  }, [categoryId, initialFilter]);
  const normalizedQuery = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      products
        .filter(
          item =>
            item.categoryId === categoryId &&
            (!subcategoryId || item.subcategoryId === subcategoryId) &&
            matchesFilter(item, filter) &&
            item.name.toLowerCase().includes(normalizedQuery),
        )
        .sort((a, b) =>
          sort === 'low'
            ? a.price - b.price
            : sort === 'high'
            ? b.price - a.price
            : sort === 'rating'
            ? Number(b.rating) - Number(a.rating)
            : sort === 'discount'
            ? 1 - b.price / b.originalPrice - (1 - a.price / a.originalPrice)
            : 0,
        ),
    [categoryId, filter, normalizedQuery, sort, subcategoryId],
  );
  const restaurants = useMemo(
    () =>
      shops.filter(
        item =>
          categoryId === 'food' &&
          item.categoryId === categoryId &&
          (!subcategoryId || item.subcategoryId === subcategoryId) &&
          item.name.toLowerCase().includes(normalizedQuery),
      ),
    [categoryId, normalizedQuery, subcategoryId],
  );
  return (
    <Page style={{paddingTop: 0}}>
      <View style={{paddingTop: insets.top}}>
        <Heading
          title={embedded ? 'Categories' : category?.name || 'Products'}
          titleStyle={{fontSize: 18, lineHeight: 24}}
          navigation={navigation}
          back={!embedded}
          right={
            <View style={s.row}>
              <IconButton
                icon="favorite-border"
                label="Open wishlist"
                onPress={() => navigation.navigate('Wishlist')}
              />
              <IconButton
                icon="shopping-cart"
                label="Open cart"
                badge={Object.values(cart).reduce(
                  (sum, count) => sum + count,
                  0,
                )}
                onPress={() => navigation.navigate('Cart')}
              />
            </View>
          }
        />
      </View>

      <View style={s.searchRow}>
        <SearchField
          value={query}
          onChangeText={setQuery}
          style={{flex: 1}}
        />
        <Pressable
          style={s.chip}
          accessibilityRole="button"
          onPress={() => setSheet('filter')}>
          <MaterialIcons name="tune" size={20} color={colors.muted} />
          <Text style={s.chipText}>Filter</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.chipTrack}
        contentContainerStyle={{gap: 8, paddingHorizontal: 16}}>
        <Pressable
          style={s.chip}
          accessibilityRole="button"
          onPress={() => setSheet('sort')}>
          <Text style={s.chipText}>
            {sort === 'low'
              ? 'Price: low to high'
              : sort === 'high'
              ? 'Price: high to low'
              : 'Sort by'}
          </Text>
          <MaterialIcons name="expand-more" size={20} color={colors.muted} />
        </Pressable>
        {[
          ['discount', 'local-offer', 'Top Discount'],
          ['rating', 'star-border', 'Top Rated'],
        ].map(([id, icon, label]) => (
          <Pressable
            key={id}
            style={[s.chip, sort === id && s.selectedChip]}
            accessibilityRole="button"
            accessibilityState={{selected: sort === id}}
            onPress={() => setSort(sort === id ? 'recommended' : id)}>
            <MaterialIcons name={icon} size={18} color={colors.muted} />
            <Text style={s.chipText}>{label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {embedded ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{flexGrow: 0, marginBottom: 8}}
          contentContainerStyle={{paddingHorizontal: 12, gap: 8}}>
          {categories.map(item => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`Browse ${item.name}`}
              accessibilityState={{selected: item.id === categoryId}}
              onPress={() => navigation.setParams({categoryId: item.id, subcategoryId: null, filter: 'all'})}
              style={{width: 76, alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4, borderRadius: 13, backgroundColor: item.id === categoryId ? '#E7E2FF' : 'transparent', borderWidth: 1, borderColor: item.id === categoryId ? '#C8BDFF' : 'transparent'}}>
              <ReferenceArtwork art={item.art} width={42} height={42} resizeMode="contain" />
              <Text numberOfLines={2} style={{fontSize: 12, lineHeight: 15, height: 26, marginTop: 5, textAlign: 'center', fontWeight: item.id === categoryId ? '700' : '500', color: item.id === categoryId ? colors.primary : colors.ink}}>{item.shortName || item.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
      <View style={{flex: 1, flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#EEEAF7'}}>
        <ScrollView style={{width: sidebarWidth, flexGrow: 0, backgroundColor: '#FFFFFF', borderRightWidth: 1, borderRightColor: '#EEEAF7'}} contentContainerStyle={{paddingVertical: 8, paddingBottom: 90}} showsVerticalScrollIndicator={false}>
          {[{id: undefined, name: 'All', art: category?.art}, ...(category?.subcategories || [])].map(sub => (
            <Pressable
              key={sub.id || 'all'}
              accessibilityRole="button"
              accessibilityState={{selected: (subcategoryId || undefined) === sub.id}}
              onPress={() => {
                navigation.setParams({subcategoryId: sub.id || null});
                productScroll.current?.scrollTo({y: 0, animated: false});
              }}
              style={{alignItems: 'center', paddingHorizontal: 6, paddingVertical: 10, marginBottom: 4, backgroundColor: (subcategoryId || undefined) === sub.id ? '#F1EEFF' : 'transparent', borderLeftWidth: 3, borderLeftColor: (subcategoryId || undefined) === sub.id ? colors.primary : 'transparent'}}>
              <LinearGradient colors={(subcategoryId || undefined) === sub.id ? ['#E4DFFF', '#CFC8FF'] : ['#FFFFFF', '#E9E7EE']} style={{width: 56, height: 56, borderRadius: 13, alignItems: 'center', justifyContent: 'center'}}>
                {sub.art ? <ReferenceArtwork art={sub.art} width={45} height={45} resizeMode="contain" /> : <MaterialIcons name="apps" size={26} color={colors.primary} />}
              </LinearGradient>
              <Text style={{fontSize: 12, lineHeight: 16, textAlign: 'center', marginTop: 6, fontWeight: (subcategoryId || undefined) === sub.id ? '700' : '500', color: (subcategoryId || undefined) === sub.id ? colors.primary : colors.ink}}>{sub.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      <ScrollView
        ref={productScroll}
        style={{flex: 1, backgroundColor: '#F8F7FC'}}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[s.content, {paddingHorizontal: 12}]}>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 14}}>
          <Text style={{flex: 1, fontSize: 16, lineHeight: 21, fontWeight: '700', color: colors.ink}}>{subcategory?.name || 'All products'}</Text>
          <View style={{backgroundColor: '#EAE5FF', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4}}>
            <Text style={{fontSize: 12, fontWeight: '700', color: '#6250B5'}}>{visible.length}</Text>
          </View>
        </View>
        <View style={[s.grid, {rowGap: 12}]}>
          {visible.map(item => (
            <ProductCard
              key={item.id}
              product={item}
              width={productWidth}
              variant="categoryGrid"
              navigation={navigation}
            />
          ))}
        </View>
        {!visible.length && !restaurants.length ? (
          <EmptyState message="No products match your search and filters." />
        ) : null}
        {restaurants.length ? (
          <Text style={[ui.sectionTitle, {marginTop: 24}]}>
            Restaurants near you
          </Text>
        ) : null}
        {restaurants.map(shop => (
          <Pressable
            key={shop.id}
            style={s.productRow}
            accessibilityRole="button"
            onPress={() =>
              navigation.navigate('ShopDetails', {shopId: shop.id})
            }>
            <ReferenceArtwork art={shop.art} width={65} height={65} />
            <View style={{flex: 1}}>
              <Text style={s.bold}>{shop.name}</Text>
              <Text style={s.muted}>
                ★ {shop.rating} · {shop.time}
              </Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={colors.primary}
            />
          </Pressable>
        ))}
      </ScrollView>
      </View>
      <CartPill navigation={navigation} bottomInset={insets.bottom} />
      <Choices
        visible={!!sheet}
        title={sheet === 'filter' ? 'Filter products' : 'Sort products'}
        options={
          sheet === 'filter'
            ? [
                ['all', 'All products'],
                ['under500', 'Under ₹500'],
                ['toprated', 'Rating 4.5 and above'],
              ]
            : [
                ['recommended', 'Recommended'],
                ['low', 'Price: low to high'],
                ['high', 'Price: high to low'],
                ['discount', 'Top Discount'],
                ['rating', 'Top Rated'],
              ]
        }
        value={sheet === 'filter' ? filter : sort}
        onSelect={sheet === 'filter' ? setFilter : setSort}
        onClose={() => setSheet('')}
      />
    </Page>
  );
}

export function WishlistScreen({navigation}) {
  const {width} = useWindowDimensions();
  const wishlist = useSelector(state => state.commerce.wishlist);
  const items = products.filter(item => wishlist.includes(item.id));
  return (
    <Page>
      <Heading title="Wishlist" navigation={navigation} back />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}>
        <View style={s.grid}>
          {items.map(item => (
            <ProductCard
              key={item.id}
              product={item}
              width={(width - 44) / 2}
              variant="wishlist"
              navigation={navigation}
            />
          ))}
        </View>
        {!items.length ? (
          <EmptyState message="Your wishlist is empty. Tap the heart on a product to save it here." />
        ) : null}
      </ScrollView>
    </Page>
  );
}

export {default as ProductDetailsScreen} from './ProductDetailsScreen';

export function CartScreen({navigation}) {
  const dispatch = useDispatch();
  const {width} = useWindowDimensions();
  const placing = useRef(false);
  const cart = useSelector(state => state.commerce.cart);
  const address = useSelector(state => state.Auth.deliveryAddress);
  const phone = useSelector(state => state.Auth.mobileNumber);
  const [collapsed, setCollapsed] = useState([]);
  const coupon = useSelector(state => state.commerce.couponCode);
  const orders = useSelector(state => state.commerce.orders);
  const items = products.filter(item => cart[item.id]);
  const groups = categories
    .map(category => ({
      ...category,
      items: items.filter(item => item.categoryId === category.id),
    }))
    .filter(group => group.items.length);
  const amount = items.reduce(
    (sum, item) => sum + item.price * cart[item.id],
    0,
  );
  const original = items.reduce(
    (sum, item) => sum + item.originalPrice * cart[item.id],
    0,
  );
  const discount = coupon
    ? evaluateCoupon(
        coupon,
        items.map(item => ({...item, quantity: cart[item.id]})),
        orders,
      ).discount
    : 0;
  const total = amount - discount;
  const recommendations = products.filter(item => !cart[item.id]).slice(0, 6);
  const checkout = () => {
    if (!address) {
      navigation.navigate('AddressList', {isFromCart: true});
      return;
    }
    if (!items.length || placing.current) {
      return;
    }
    placing.current = true;
    const now = new Date();
    const order = {
      id: `preview-${now.getTime()}`,
      placed: now.toLocaleString('en-IN'),
      status: 'Confirmed',
      address: {...address},
      phone,
      count: Object.values(cart).reduce((sum, count) => sum + count, 0),
      price: total,
      originalPrice: original,
      couponDiscount: discount,
      couponCode: discount > 0 ? coupon : null,
      savings: original - total,
      groups: groups.map(group => ({
        id: 'shipment-' + now.getTime() + '-' + group.id,
        categoryId: group.id,
        status: 'Confirmed',
        tracking: [
          {status: 'Placed', at: now.toLocaleString('en-IN')},
          {status: 'Confirmed', at: now.toLocaleString('en-IN')},
        ],
        deliveryPartner: null,
        trackingNumber: null,
        estimatedDelivery: null,
        name: group.name,
        count: group.items.reduce((sum, item) => sum + cart[item.id], 0),
        price: group.items.reduce(
          (sum, item) => sum + item.price * cart[item.id],
          0,
        ),
        originalPrice: group.items.reduce(
          (sum, item) => sum + item.originalPrice * cart[item.id],
          0,
        ),
        productIds: group.items.map(item => item.id),
      })),
      items: items.map(item => ({...item, quantity: cart[item.id]})),
    };
    dispatch(placePreviewOrder(order));
    navigation.replace('OrderConfirmation', {orderId: order.id});
  };
  return (
    <Page style={{backgroundColor: '#F8F8FB'}}>
      <Heading
        title="Cart"
        back
        navigation={navigation}
        right={items.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear all items from cart"
            onPress={() => {
              dispatch(clearCart());
              setCollapsed([]);
            }}
            style={{flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, minHeight: 40, borderRadius: 10, backgroundColor: '#FFF0F0'}}>
            <MaterialIcons name="delete-outline" size={19} color="#BC3C47" />
            <Text style={{fontSize: 14, fontWeight: '700', color: '#BC3C47'}}>Clear cart</Text>
          </Pressable>
        ) : null}
      />
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}>
        {groups.map(group => {
          const open = !collapsed.includes(group.id);
          const groupTotal = group.items.reduce(
            (sum, item) => sum + item.price * cart[item.id],
            0,
          );
          return (
            <Section
              key={group.id}
              style={{padding: 12, marginTop: 0, marginBottom: 12}}>
              <Pressable
                style={s.row}
                accessibilityRole="button"
                accessibilityState={{expanded: open}}
                onPress={() =>
                  setCollapsed(current =>
                    current.includes(group.id)
                      ? current.filter(id => id !== group.id)
                      : [...current, group.id],
                  )
                }>
                <ReferenceArtwork
                  art={group.art}
                  width={44}
                  height={44}
                  style={{borderRadius: 10}}
                />
                <View style={{flex: 1}}>
                  <Text style={s.bold}>{group.name}</Text>
                  <Text style={s.muted}>
                    {group.items.reduce((sum, item) => sum + cart[item.id], 0)}{' '}
                    Items
                  </Text>
                </View>
                <Text style={s.bold}>{money(groupTotal)}</Text>
                <MaterialIcons
                  name={open ? 'expand-less' : 'expand-more'}
                  size={24}
                  color={colors.muted}
                />
              </Pressable>
              {open
                ? group.items.map(item => (
                    <View key={item.id} style={s.cartRow}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() =>
                          navigation.navigate('ProductDetails', {
                            productId: item.id,
                          })
                        }>
                        <ReferenceArtwork
                          art={item.art}
                          width={62}
                          height={72}
                        />
                      </Pressable>
                      <View style={{flex: 1}}>
                        <Text style={s.cartName} numberOfLines={2}>
                          {item.name}
                        </Text>
                        <Text style={s.muted}>{item.unit}</Text>
                        <View style={s.row}>
                          <Text style={s.originalSmall}>
                            {money(item.originalPrice)}
                          </Text>
                          <Text style={s.bold}>{money(item.price)}</Text>
                        </View>
                        <Text style={[s.muted, {fontSize: 10}]}>
                          Delivery to your selected address
                        </Text>
                      </View>
                      <View
                        style={{
                          alignItems: 'flex-end',
                          justifyContent: 'space-between',
                          gap: 20,
                        }}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Remove ${item.name} from cart`}
                          onPress={() => dispatch(deleteItem(item.id))}>
                          <MaterialIcons
                            name="close"
                            size={21}
                            color={colors.muted}
                          />
                        </Pressable>
                        <Quantity product={item} quantity={cart[item.id]} />
                      </View>
                    </View>
                  ))
                : null}
            </Section>
          );
        })}
        {!items.length ? (
          <EmptyState message="Your cart is empty. Add your favourite products to start shopping." />
        ) : (
          <>
            <Text style={s.smallHeading}>Delivery Details</Text>
            <Section style={{marginTop: 0}}>
              <Pressable
                style={s.infoRow}
                accessibilityRole="button"
                onPress={() =>
                  navigation.navigate('AddressList', {isFromCart: true})
                }>
                <MaterialIcons
                  name="local-shipping"
                  size={24}
                  color={colors.primary}
                />
                <View style={{flex: 1}}>
                  <Text style={s.bold}>
                    {address?.address_type || 'Choose address'}
                  </Text>
                  <Text style={s.muted}>
                    {address?.full_address || 'Add an address to continue'}
                  </Text>
                </View>
                <MaterialIcons
                  name="chevron-right"
                  size={24}
                  color={colors.muted}
                />
              </Pressable>
              <Pressable
                style={[s.infoRow, s.divider]}
                accessibilityRole="button"
                onPress={() =>
                  navigation.navigate(
                    'AddAddress',
                    address ? {address} : undefined,
                  )
                }>
                <MaterialIcons
                  name="phone-in-talk"
                  size={24}
                  color={colors.primary}
                />
                <View style={{flex: 1}}>
                  <Text style={s.bold}>
                    {address?.customer_name || 'Contact details'}
                  </Text>
                  <Text style={s.muted}>
                    +91 {address?.customer_mobile_number || phone}
                  </Text>
                </View>
                <MaterialIcons
                  name="chevron-right"
                  size={24}
                  color={colors.muted}
                />
              </Pressable>
            </Section>
            <Pressable
              style={[s.section, s.row]}
              accessibilityRole="button"
              onPress={() => navigation.navigate('Coupons')}>
              <MaterialIcons name="local-offer" size={29} color="#FF7655" />
              <Text style={[s.bold, {flex: 1}]}>
                {coupon
                  ? discount > 0
                    ? `${coupon} applied · ${money(discount)} off`
                    : `${coupon} · Requirements not met`
                  : 'Apply coupons'}
              </Text>
              <MaterialIcons
                name="chevron-right"
                size={24}
                color={colors.muted}
              />
            </Pressable>
            <Section title="Add More">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{gap: 12}}>
                {recommendations.map(item => (
                  <ProductCard
                    key={item.id}
                    product={item}
                    width={Math.min(width * 0.34, 150)}
                    navigation={navigation}
                  />
                ))}
              </ScrollView>
            </Section>
            <Section title="Billing">
              <BillRow label="Amount" value={money(original)} />
              <BillRow label="Savings" value={`−${money(original - amount)}`} />
              <BillRow
                label={
                  coupon && discount > 0
                    ? `Coupon Discount · ${coupon}`
                    : 'Coupon Discount'
                }
                value={`−${money(discount)}`}
              />
              <View style={s.divider}>
                <BillRow label="Subtotal" value={money(total)} />
                <BillRow label="GST" value="Included" />
                <BillRow label="Delivery Charge" value="FREE" blue />
              </View>
              <View style={s.divider}>
                <BillRow label="TOTAL" value={money(total)} strong />
              </View>
            </Section>
          </>
        )}
      </ScrollView>
      <Footer style={{backgroundColor: '#FFFFFF', alignItems: 'center'}}>
        {items.length ? (
          <>
            <View style={{flex: 1}}>
              <Text style={s.total}>{money(total)}</Text>
              <Text style={s.green}>Saved {money(original - total)}</Text>
            </View>
            <Pressable
              style={ui.action}
              accessibilityRole="button"
              onPress={checkout}>
              <Text style={ui.actionText}>
                {address ? 'Place order' : 'Choose address'}
              </Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            style={[ui.action, {flex: 1}]}
            accessibilityRole="button"
            onPress={() => navigation.navigate('Home', {screen: 'HomeTab'})}>
            <Text style={ui.actionText}>Continue shopping</Text>
          </Pressable>
        )}
      </Footer>
    </Page>
  );
}

export function OrderConfirmationScreen({navigation, route}) {
  const order = useSelector(state =>
    state.commerce.orders.find(item => item.id === route.params?.orderId),
  );
  const {width} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  useFocusEffect(
    useCallback(() => {
      if (!order?.id) return;
      const timer = setTimeout(
        () => navigation.replace('OrderDetails', {orderId: order.id}),
        1500,
      );
      return () => clearTimeout(timer);
    }, [navigation, order?.id]),
  );
  return (
    <Page>
      <ScrollView
        contentContainerStyle={[
          s.confirmation,
          {paddingBottom: Math.max(insets.bottom, 18)},
        ]}
        showsVerticalScrollIndicator={false}>
        <SuccessCelebration loop size={Math.min(width * 0.5, 210)}>
          <Image
            source={require('../../assets/main/references/order-confirmed.png')}
            style={{
              width: Math.min(width * 0.5, 210),
              height: Math.min(width * 0.5, 210),
            }}
            resizeMode="contain"
          />
        </SuccessCelebration>
        <Text style={s.confirmOrder}>Order</Text>
        <Text style={s.confirmTitle}>Confirmed</Text>
        <Text style={s.confirmAddress} numberOfLines={3}>
          {order?.address?.full_address || 'Your delivery address'}
        </Text>
        <View style={s.saved}>
          <MaterialIcons name="verified" size={27} color={colors.primary} />
          <Text style={s.savedText}>
            {money(order?.savings || 0)} saved from this order
          </Text>
        </View>
        <Pressable
          style={s.backHome}
          accessibilityRole="button"
          onPress={() =>
            navigation.reset({
              index: 0,
              routes: [{name: 'Home', params: {screen: 'HomeTab'}}],
            })
          }>
          <MaterialIcons name="arrow-back" size={25} color="#5C6975" />
          <Text style={s.backHomeText}>Back to Home</Text>
        </Pressable>
        <Pressable
          style={{padding: 14}}
          accessibilityRole="button"
          onPress={() =>
            navigation.replace('OrderDetails', {orderId: order?.id})
          }>
          <Text style={s.blue}>View order details</Text>
        </Pressable>
      </ScrollView>
    </Page>
  );
}

export function OrderDetailsScreen({navigation, route}) {
  const previewOrders = useSelector(state => state.commerce.orders);
  const auth = useSelector(state => state.Auth);
  const savedFeedback = useSelector(
    state => state.commerce.feedback[route.params?.orderId],
  );
  const order = [...previewOrders, ...sampleOrders].find(
    item => item.id === route.params?.orderId,
  );
  const [rating, setRating] = useState(savedFeedback?.rating || 0);
  const [feedback, setFeedback] = useState(savedFeedback?.text || '');
  const [saved, setSaved] = useState(false);
  const dispatch = useDispatch();
  if (!order) {
    return (
      <Page>
        <Heading title="Orders Details" navigation={navigation} back />
        <EmptyState message="This order is unavailable." />
      </Page>
    );
  }
  const groups = order.groups.filter(
    group => !route.params?.groupName || group.name === route.params.groupName,
  );
  const ids = groups.flatMap(group => group.productIds);
  const items = order.items
    ? order.items.filter(item => ids.includes(item.id))
    : ids
        .map(id => products.find(item => item.id === id))
        .filter(Boolean)
        .map(item => ({...item, quantity: 1}));
  const address = order.address || auth.deliveryAddress;
  const amount = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const original = items.reduce(
    (sum, item) => sum + item.originalPrice * item.quantity,
    0,
  );
  const discount = route.params?.groupName ? 0 : order.couponDiscount || 0;
  return (
    <Page>
      <Heading title="Orders Details" navigation={navigation} back />
      <ScrollView
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Section style={{marginTop: 0}}>
          <Text style={s.bold}>Order #{order.id}</Text>
          <Text style={s.muted}>{order.placed}</Text>
          <Text style={[s.bold, {marginTop: 12}]}>
            {order.groups.length} category{' '}
            {order.groups.length === 1 ? 'shipment' : 'shipments'}
          </Text>
          <Text style={s.muted}>
            Each category is fulfilled and tracked separately.
          </Text>
          <Text style={s.green}>
            {
              order.groups.filter(
                group => shipmentStatus(group, order) === 'Delivered',
              ).length
            }{' '}
            of {order.groups.length} delivered
          </Text>
        </Section>
        {groups.map(group => (
          <OrderShipment
            key={group.id || group.name}
            group={group}
            order={order}
            items={items}
            navigation={navigation}
          />
        ))}
        <Section>
          <TextInput
            multiline
            value={feedback}
            onChangeText={text => {
              setFeedback(text);
              setSaved(false);
            }}
            placeholder="Feedback on this..."
            placeholderTextColor="#777777"
            style={s.feedback}
            textAlignVertical="top"
            accessibilityLabel="Feedback on this order"
          />
          <View style={s.stars}>
            {[1, 2, 3, 4, 5].map(value => (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityLabel={`Rate ${value} out of 5`}
                accessibilityState={{selected: rating === value}}
                onPress={() => {
                  setRating(value);
                  setSaved(false);
                }}>
                <MaterialIcons
                  name="star"
                  size={31}
                  color={value <= rating ? '#F7BD00' : '#E2E2E2'}
                />
              </Pressable>
            ))}
          </View>
          <Text style={[s.muted, {textAlign: 'center'}]}>
            Rate this order now
          </Text>
          <Pressable
            accessibilityRole="button"
            disabled={!rating && !feedback.trim()}
            onPress={() => {
              dispatch(
                saveOrderFeedback({
                  orderId: order.id,
                  rating,
                  text: feedback.trim(),
                }),
              );
              setSaved(true);
            }}
            style={[
              s.feedbackSave,
              !rating && !feedback.trim() && {opacity: 0.4},
            ]}>
            <Text style={s.blue}>
              {saved ? 'Feedback saved' : 'Save feedback'}
            </Text>
          </Pressable>
        </Section>
        <Section title="Shipping Details">
          <InfoRow
            icon="person-outline"
            label="NAME"
            value={address?.customer_name || 'Nitin'}
          />
          <InfoRow
            icon="phone"
            label="PH NO"
            value={`+91 ${
              address?.customer_mobile_number ||
              order.phone ||
              auth.mobileNumber ||
              '9876543210'
            }`}
          />
          <InfoRow
            icon="location-on"
            label="ADDRESS"
            value={
              address?.full_address ||
              'Magadi Main Rd, Bengaluru, Karnataka 560023'
            }
          />
        </Section>
        <Section title="Bill details">
          <BillRow label="Items total" value={money(original)} />
          <BillRow
            label="Savings"
            value={`−${money(original - amount)}`}
            blue
          />
          <BillRow label="Coupon discount" value={`−${money(discount)}`} blue />
          <BillRow label="Delivery charge" value="FREE" />
          <BillRow label="GST" value="Included" />
          <View style={s.divider}>
            <BillRow label="TOTAL" value={money(amount - discount)} strong />
          </View>
        </Section>
      </ScrollView>
    </Page>
  );
}

const s = StyleSheet.create({
  content: {paddingHorizontal: 16, paddingTop: 8, paddingBottom: 86},
  grid: {flexDirection: 'row', flexWrap: 'wrap', gap: 12, rowGap: 24},
  row: {flexDirection: 'row', alignItems: 'center', gap: 8},
  bold: {fontSize: 14, lineHeight: 20, fontWeight: '700', color: colors.ink},
  blue: {fontSize: 14, fontWeight: '600', color: colors.primary},
  green: {fontSize: 15, fontWeight: '700', color: '#009B48'},
  muted: {fontSize: 12, lineHeight: 18, color: '#64707C', marginTop: 3},
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#F50000',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    borderRadius: 10,
    minWidth: 18,
    textAlign: 'center',
    padding: 2,
  },
  headerGradient: {position: 'absolute', top: 0, right: 0, left: 0},
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 14,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#C8CFDB',
    borderRadius: 8,
    paddingHorizontal: 10,
    minHeight: 34,
    backgroundColor: '#FFFFFF',
  },
  selectedChip: {backgroundColor: '#EDEAFF', borderColor: colors.primary},
  chipText: {fontSize: 13, color: '#49555F', fontWeight: '600'},
  chipTrack: {flexGrow: 0, marginBottom: 14, minHeight: 35},
  backdrop: {flex: 1, backgroundColor: '#00000055', justifyContent: 'flex-end'},
  sheet: {
    padding: 22,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#FFFFFF',
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginTop: 16,
    marginBottom: 2,
    borderWidth: 1,
    borderColor: '#F0F0F3',
  },
  sectionShadow: {
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111111',
    borderBottomWidth: 1,
    borderColor: '#EEEEF1',
    paddingBottom: 12,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  infoLabel: {fontSize: 11, color: '#8B94A8', marginBottom: 3},
  infoValue: {fontSize: 14, lineHeight: 20, color: colors.ink},
  billRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
  },
  billLabel: {fontSize: 13, lineHeight: 18, color: '#49535D', flexShrink: 1},
  billValue: {fontSize: 13, lineHeight: 18, color: colors.ink},
  billTotalValue: {
    fontSize: 15,
    lineHeight: 20,
    color: colors.ink,
    fontWeight: '700',
  },
  divider: {
    borderTopWidth: 1,
    borderColor: '#E5E8F0',
    marginTop: 8,
    paddingTop: 8,
  },
  quantity: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  quantityButton: {
    width: 25,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    minWidth: 14,
    textAlign: 'center',
  },
  hero: {
    backgroundColor: '#F4F4F4',
    position: 'relative',
  },
  heroNav: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  productImageStage: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F4F4',
    overflow: 'hidden',
  },
  heroRating: {
    position: 'absolute',
    right: 16,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#EDEDED',
    backgroundColor: '#FFFFFF',
  },
  reviewCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#303030',
    marginLeft: 4,
  },
  galleryDots: {
    position: 'absolute',
    left: 20,
    bottom: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  galleryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7A7A7A',
  },
  galleryDotActive: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  detailPanel: {
    marginHorizontal: 8,
    marginTop: -8,
    borderRadius: 14,
    padding: 12,
    zIndex: 1,
  },
  detailTitleRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 10},
  vegetarianMark: {
    width: 17,
    height: 17,
    borderWidth: 1.5,
    borderColor: '#00A54F',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 3,
  },
  vegetarianDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00A54F',
  },
  detailName: {
    fontSize: 20,
    lineHeight: 27,
    fontWeight: '700',
    color: colors.ink,
  },
  detailDescription: {
    fontSize: 14,
    lineHeight: 19,
    color: '#5C6975',
    marginTop: 6,
  },
  detailUnit: {
    fontSize: 14,
    lineHeight: 19,
    color: '#5C6975',
    marginTop: 7,
    marginBottom: 5,
  },
  total: {fontSize: 20, lineHeight: 25, fontWeight: '700', color: colors.ink},
  footerPrice: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    color: colors.ink,
  },
  pricePerUnit: {fontSize: 14, lineHeight: 19, color: '#64707C', marginTop: 4},
  original: {
    fontSize: 14,
    color: '#667180',
    textDecorationLine: 'line-through',
  },
  originalSmall: {
    fontSize: 12,
    color: '#667180',
    textDecorationLine: 'line-through',
  },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderTopWidth: 1,
    borderColor: '#DDDDDD',
    paddingTop: 11,
    marginTop: 10,
  },
  similarSection: {
    marginHorizontal: 8,
    marginTop: 16,
    padding: 12,
    borderRadius: 16,
  },
  similarTitle: {
    borderBottomWidth: 0,
    paddingBottom: 0,
    marginBottom: 12,
    fontSize: 17,
    lineHeight: 22,
  },
  smallHeading: {
    fontSize: 15,
    fontWeight: '600',
    color: '#626C75',
    marginTop: 18,
    marginBottom: 10,
  },
  cartRow: {
    flexDirection: 'row',
    gap: 9,
    borderTopWidth: 1,
    borderColor: '#E7EAF1',
    paddingVertical: 14,
    marginTop: 10,
  },
  cartName: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
    color: colors.ink,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  confirmation: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingTop: 18,
  },
  confirmOrder: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 8,
  },
  confirmTitle: {fontSize: 26, fontWeight: '800', color: '#000000'},
  confirmAddress: {
    fontSize: 14,
    lineHeight: 20,
    color: '#5C6975',
    textAlign: 'center',
    marginTop: 12,
  },
  saved: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: '#EDEBFF',
    borderRadius: 11,
    padding: 10,
    width: '100%',
  },
  savedText: {fontSize: 14, fontWeight: '700', color: colors.primary, flex: 1},
  backHome: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderColor: '#8C95A8',
  },
  backHomeText: {fontSize: 16, color: '#5C6975', fontWeight: '700'},
  orderProduct: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 9,
    borderWidth: 1,
    borderColor: '#E7EAF2',
    borderRadius: 12,
    marginTop: 10,
  },
  feedback: {
    minHeight: 88,
    backgroundColor: '#F6F6F7',
    borderRadius: 10,
    fontSize: 14,
    padding: 14,
    color: colors.ink,
  },
  stars: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
  },
  feedbackSave: {alignItems: 'center', padding: 10},
  timelineRow: {flexDirection: 'row', gap: 12, minHeight: 68},
  timelineRail: {width: 25, alignItems: 'center'},
  timelineLine: {
    flex: 1,
    borderLeftWidth: 1,
    borderColor: '#AAAEB8',
    marginVertical: 3,
  },
});
