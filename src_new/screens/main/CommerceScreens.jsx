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
import {includedGst, money} from '../../config/catalog';
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
import ConfirmDialog from '../../components/main/ConfirmDialog';
import GradientButton from '../../components/main/GradientButton';
import ReferenceArtwork from '../../components/main/ReferenceArtwork';
import {
  CategorySidebarSkeleton,
  LoadingImage as Image,
  ProductGridSkeleton,
} from '../../components/main/Skeleton';
import ProductCard from '../../components/main/ProductCard';
import CartPill from '../../components/main/CartPill';
import {matchesFilter} from './MainCategoriesScreen';
import api from '../../utils/api';
import {endpoints} from '../../config/config';
import {
  evaluateLiveCoupon,
  getLiveCategories,
  getLiveCoupons,
  cancelLiveOrder,
  rateLiveOrderItem,
  rateLiveShipments,
  getLiveItems,
  getLiveSubcategories,
  getOrderCharges,
  groupVariants,
  liveCatalogEnabled,
  useAllOrders,
  useOrders,
  useLiveItemsByIds,
  useLiveOrderItems,
} from '../../services/catalogService';

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
const FILTER_OPTIONS = [
  ['all', 'All products'],
  ['under500', 'Under ₹500'],
  ['toprated', 'Rating 4.5 and above'],
  ['topdiscount', 'Top discounts (30% off or more)'],
];
const SORT_OPTIONS = [
  ['recommended', 'Recommended'],
  ['low', 'Price: low to high'],
  ['high', 'Price: high to low'],
  ['discount', 'Top Discount'],
  ['rating', 'Top Rated'],
];

function FilterSortSheet({
  visible,
  filter,
  sort,
  onFilter,
  onSort,
  onReset,
  onClose,
}) {
  const insets = useSafeAreaInsets();
  const renderOptions = (options, value, onSelect) =>
    options.map(([id, label]) => (
      <Pressable
        key={id}
        style={[s.option, {paddingVertical: 13}]}
        accessibilityRole="radio"
        accessibilityState={{selected: value === id}}
        onPress={() => onSelect(id)}>
        <Text style={s.infoValue}>{label}</Text>
        <MaterialIcons
          name={value === id ? 'radio-button-checked' : 'radio-button-unchecked'}
          size={22}
          color={colors.primary}
        />
      </Pressable>
    ));
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
        <View
          style={[
            s.sheet,
            {paddingBottom: Math.max(insets.bottom, 20), maxHeight: '85%'},
          ]}>
          <View style={s.row}>
            <Text style={[ui.sectionTitle, {flex: 1}]}>Filter & sort</Text>
            <IconButton icon="close" label="Close options" onPress={onClose} />
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[s.muted, {marginTop: 8, fontWeight: '700'}]}>
              Filter
            </Text>
            {renderOptions(FILTER_OPTIONS, filter, onFilter)}
            <Text style={[s.muted, {marginTop: 8, fontWeight: '700'}]}>
              Sort by
            </Text>
            {renderOptions(SORT_OPTIONS, sort, onSort)}
          </ScrollView>
          <View style={[s.row, {gap: 12, marginTop: 12}]}>
            <Pressable
              style={[s.chip, {flex: 1, justifyContent: 'center'}]}
              accessibilityRole="button"
              onPress={onReset}>
              <Text style={s.chipText}>Reset</Text>
            </Pressable>
            <Pressable
              style={[
                s.chip,
                {
                  flex: 1,
                  justifyContent: 'center',
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
              ]}
              accessibilityRole="button"
              onPress={onClose}>
              <Text style={[s.chipText, {color: '#FFFFFF'}]}>Apply</Text>
            </Pressable>
          </View>
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
    categoryId: routeCategoryId,
    subcategoryId,
    filter: initialFilter = 'all',
    shopId,
    shopItemsTableName,
    shopName,
  } = route.params || {};
  const locationId = useSelector(state => state.Auth.locationId);
  const [categoryList, setCategoryList] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [liveItems, setLiveItems] = useState([]);
  const [liveItemsLoading, setLiveItemsLoading] = useState(liveCatalogEnabled);
  useEffect(() => {
    if (!liveCatalogEnabled) {
      return;
    }
    getLiveCategories()
      .then(setCategoryList)
      .catch(() => {});
  }, []);
  const categoryId = routeCategoryId || categoryList[0]?.id;
  const category = categoryList.find(item => item.id === categoryId);
  const tableName = shopItemsTableName || category?.shopItemsTableName;
  // Subcategories come from the backend per category and service area; the
  // items are those of the shops that stock them (or of one shop when the
  // screen was opened from a shop).
  useEffect(() => {
    if (!liveCatalogEnabled || !categoryId || !tableName || !locationId) {
      return;
    }
    let active = true;
    setLiveItemsLoading(true);
    getLiveSubcategories({categoryId, locationId})
      .then(async subs => {
        const shopIds = shopId
          ? [String(shopId)]
          : [...new Set(subs.flatMap(sub => sub.shopIds))];
        const lists = await Promise.all(
          shopIds.map(id =>
            getLiveItems({shopItemsTableName: tableName, shopId: id}).catch(
              () => [],
            ),
          ),
        );
        if (active) {
          setSubcategories(subs);
          setLiveItems(groupVariants(lists.flat()));
        }
      })
      .catch(() => {
        if (active) {
          setSubcategories([]);
          setLiveItems([]);
        }
      })
      .finally(() => {
        if (active) {
          setLiveItemsLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [categoryId, tableName, shopId, locationId]);
  const subcategory = subcategories.find(item => item.id === subcategoryId);
  const productScroll = useRef(null);
  // opened from a subcategory elsewhere in the app: just that subcategory's products, no
  // subcategory list. The Categories tab (embedded) always keeps its subcategory sidebar.
  const showSidebar = embedded || !subcategoryId;
  const sidebarWidth = showSidebar ? 86 : 0;
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
      liveItems
        .filter(
          item =>
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
    [filter, normalizedQuery, sort, subcategoryId, liveItems],
  );
  return (
    <Page style={{paddingTop: 0}}>
      <View style={{paddingTop: insets.top}}>
        <Heading
          title={
            embedded
              ? 'Categories'
              : shopName || subcategory?.name || category?.name || 'Products'
          }
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
          style={[
            s.chip,
            (filter !== 'all' || sort !== 'recommended') && s.selectedChip,
          ]}
          accessibilityRole="button"
          onPress={() => setSheet('filter')}>
          <MaterialIcons
            name="tune"
            size={20}
            color={
              filter !== 'all' || sort !== 'recommended'
                ? colors.primary
                : colors.muted
            }
          />
          <Text style={s.chipText}>Filter</Text>
        </Pressable>
      </View>
      {embedded ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{flexGrow: 0, marginBottom: 8}}
          contentContainerStyle={{paddingHorizontal: 12, gap: 8}}>
          {categoryList.map(item => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`Browse ${item.name}`}
              accessibilityState={{selected: item.id === categoryId}}
              onPress={() => navigation.setParams({categoryId: item.id, subcategoryId: null, filter: 'all', shopId: null, shopItemsTableName: null, shopName: null})}
              style={{width: 76, alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4, borderRadius: 13, backgroundColor: item.id === categoryId ? '#E7E2FF' : 'transparent', borderWidth: 1, borderColor: item.id === categoryId ? '#C8BDFF' : 'transparent'}}>
              <ReferenceArtwork art={item.art} width={42} height={42} resizeMode="contain" />
              <Text numberOfLines={2} style={{fontSize: 12, lineHeight: 15, height: 26, marginTop: 5, textAlign: 'center', fontWeight: item.id === categoryId ? '700' : '500', color: item.id === categoryId ? colors.primary : colors.ink}}>{item.shortName || item.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
      <View style={{flex: 1, flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#EEEAF7'}}>
        {showSidebar ? (
        <ScrollView style={{width: sidebarWidth, flexGrow: 0, backgroundColor: '#FFFFFF', borderRightWidth: 1, borderRightColor: '#EEEAF7'}} contentContainerStyle={{paddingVertical: 8, paddingBottom: 90}} showsVerticalScrollIndicator={false}>
          {liveItemsLoading && !subcategories.length ? (
            <CategorySidebarSkeleton size={56} />
          ) : null}
          {(liveItemsLoading && !subcategories.length
            ? []
            : [{id: undefined, name: 'All', art: category?.art}, ...subcategories]
          ).map(sub => (
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
        ) : null}
      <ScrollView
        ref={productScroll}
        style={{flex: 1, backgroundColor: '#F8F7FC'}}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[s.content, {paddingHorizontal: 12}]}>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 14}}>
          <Text style={{flex: 1, fontSize: 16, lineHeight: 21, fontWeight: '700', color: colors.ink}}>{embedded
              ? subcategory?.name || 'All products'
              : subcategoryId
              ? 'Products'
              : 'All products'}</Text>
          <View style={{backgroundColor: '#EAE5FF', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4}}>
            <Text style={{fontSize: 12, fontWeight: '700', color: '#6250B5'}}>{liveItemsLoading ? '' : visible.length}</Text>
          </View>
        </View>
        {liveItemsLoading ? (
          <ProductGridSkeleton width={productWidth} />
        ) : null}
        <View style={[s.grid, {rowGap: 12}]}>
          {(liveItemsLoading ? [] : visible).map(item => (
            <ProductCard
              key={item.id}
              product={item}
              width={productWidth}
              variant="categoryGrid"
              navigation={navigation}
            />
          ))}
        </View>
        {!visible.length && !liveItemsLoading ? (
          <EmptyState
            message={
              liveItems.length
                ? 'No products match your search and filters.'
                : 'No items available in this category yet.'
            }
          />
        ) : null}
      </ScrollView>
      </View>
      <CartPill navigation={navigation} bottomInset={insets.bottom} />
      <FilterSortSheet
        visible={sheet === 'filter'}
        filter={filter}
        sort={sort}
        onFilter={setFilter}
        onSort={setSort}
        onReset={() => {
          setFilter('all');
          setSort('recommended');
        }}
        onClose={() => setSheet('')}
      />
    </Page>
  );
}

export function WishlistScreen({navigation}) {
  const {width} = useWindowDimensions();
  const wishlist = useSelector(state => state.commerce.wishlist);
  const {itemsById} = useLiveItemsByIds(wishlist);
  const items = wishlist
    .map(id => itemsById[id])
    .filter(Boolean);
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
  const customerId = useSelector(state => state.Auth.customerId);
  const locationId = useSelector(state => state.Auth.locationId);
  const [collapsed, setCollapsed] = useState([]);
  const coupon = useSelector(state => state.commerce.couponCode);
  const cartIds = Object.keys(cart);
  const {itemsById: liveCartItemsById} = useLiveItemsByIds(cartIds);
  const items = cartIds
    .map(id => liveCartItemsById[id])
    .filter(Boolean);
  const firstCartItem = items[0];
  const [liveGroupNames, setLiveGroupNames] = useState({});
  useEffect(() => {
    if (!liveCatalogEnabled) {
      return;
    }
    const missing = [...new Set(items.map(item => item.categoryId))].filter(
      id => !liveGroupNames[id],
    );
    if (!missing.length) {
      return;
    }
    getLiveCategories()
      .then(rows => {
        const found = {};
        rows.forEach(row => {
          if (missing.includes(row.id)) {
            found[row.id] = row;
          }
        });
        if (Object.keys(found).length) {
          setLiveGroupNames(current => ({...current, ...found}));
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.map(item => item.categoryId).join(',')]);
  const groups = Object.values(
    items.reduce((byCategory, item) => {
      const key = item.categoryId;
      if (!byCategory[key]) {
        const liveCategory = liveGroupNames[key];
        byCategory[key] = {
          id: key,
          name: liveCategory?.name || 'Items',
          art: liveCategory?.art || items[0]?.art,
          items: [],
        };
      }
      byCategory[key].items.push(item);
      return byCategory;
    }, {}),
  );
  const amount = items.reduce(
    (sum, item) => sum + item.price * cart[item.id],
    0,
  );
  const original = items.reduce(
    (sum, item) => sum + item.originalPrice * cart[item.id],
    0,
  );
  const [liveOffers, setLiveOffers] = useState([]);
  useEffect(() => {
    if (!liveCatalogEnabled || !coupon || !locationId) {
      return;
    }
    getLiveCoupons({
      locationId,
      categoryId: firstCartItem?.categoryId || 0,
      shopId: firstCartItem?.shopId || 0,
    })
      .then(setLiveOffers)
      .catch(() => setLiveOffers([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coupon, locationId, firstCartItem?.categoryId, firstCartItem?.shopId]);
  const discount = coupon
    ? evaluateLiveCoupon(
        coupon,
        liveOffers,
        items.map(item => ({...item, quantity: cart[item.id]})),
      ).discount
    : 0;
  // Delivery, packing, platform fee, donation and gst from the dashboard's settings.
  const [charges, setCharges] = useState(null);
  const chargeKey = items
    .map(item => `${item.shopId}:${item.price * cart[item.id]}`)
    .join(',');
  useEffect(() => {
    if (!liveCatalogEnabled || !items.length || !locationId) {
      setCharges(null);
      return undefined;
    }
    let active = true;
    getOrderCharges({
      locationId: address?.location_id || locationId,
      coordinates: {
        latitude: address?.customer_latitude,
        longitude: address?.customer_longitude,
      },
      items: items.map(item => ({
        shopId: item.shopId,
        total: item.price * cart[item.id],
      })),
    })
      .then(result => active && setCharges(result))
      .catch(() => active && setCharges(null));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chargeKey, locationId, address?.customer_latitude, address?.customer_longitude]);
  const itemGst = items.reduce(
    (sum, item) =>
      sum + includedGst(item.price * cart[item.id], item.gstPercent),
    0,
  );
  const total = amount - discount + (charges?.total || 0);
  const [liveRecommendations, setLiveRecommendations] = useState([]);
  useEffect(() => {
    if (!liveCatalogEnabled || !firstCartItem?.shopItemsTableName) {
      return;
    }
    let active = true;
    getLiveItems({
      shopItemsTableName: firstCartItem.shopItemsTableName,
      shopId: firstCartItem.shopId,
    })
      .then(rows => {
        if (active) {
          setLiveRecommendations(
            groupVariants(rows).filter(row => !cart[row.id]).slice(0, 6),
          );
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [firstCartItem?.shopItemsTableName, firstCartItem?.shopId]);
  const recommendations = liveRecommendations;
  const [placingLive, setPlacingLive] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const checkout = async () => {
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
      savings: original - amount + discount,
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

    if (liveCatalogEnabled && customerId) {
      setPlacingLive(true);
      try {
        const liveCoupon = discount > 0
          ? liveOffers.find(o => o.code === coupon)
          : null;
        const subOrderArray = items.map(item => {
          const qty = cart[item.id];
          const lineTotal = item.price * qty;
          return {
            item_id: item.itemId,
            item_name: item.name,
            item_image: item.art?.source?.uri || null,
            category_id: item.categoryId,
            sub_category_id: item.subcategoryId,
            category_name: null,
            sub_category_name: null,
            actualitem_price: item.originalPrice,
            item_price: item.price,
            sub_item_count: qty,
            item_total_amount: lineTotal,
            filter_name: null,
            item_description: item.description || '',
            saving_price: (item.originalPrice - item.price) * qty,
            shop_id: item.shopId,
            filter_one: null,
            // the price already includes gst: take the gst out of it
            item_gst_amount: includedGst(lineTotal, item.gstPercent),
            item_gst: item.gstPercent || 0,
          };
        });
        const response = await api.post(endpoints.PLACE_ORDER, {
          customer_id: customerId,
          customer_name: address.customer_name || '',
          customer_mobile_number: address.customer_mobile_number || phone || '',
          category_id: firstCartItem?.categoryId || 0,
          shop_id: firstCartItem?.shopId || 0,
          admin_percentage: 0,
          item_count: Object.values(cart).reduce((sum, count) => sum + count, 0),
          actual_total_amount: original,
          total_amount: amount,
          total_saving_amount: original - amount,
          coupon_amount: discount,
          coupon_id: liveCoupon?.id,
          coupon_type: 0,
          // the server recomputes these from the dashboard settings when the order is saved
          delivery_charges: charges?.delivery || 0,
          delivery_charges_gst: 0,
          handling_charges: charges?.platform || 0,
          packing_charges: charges?.packing || 0,
          packing_charges_gst: 0,
          donation_charges: charges?.donation || 0,
          surcharges: charges?.surcharges || 0,
          gstonplatform_fee: 0,
          total_item_gst_amount: subOrderArray.reduce((sum, i) => sum + i.item_gst_amount, 0),
          grand_total: total,
          location_id: address.location_id || locationId,
          location_name: address.location_name || '',
          payment_type: 'Cash On Delivery',
          order_status: 0,
          order_type: 0,
          slot_indication: 0,
          order_instructions: '',
          delivery_instruction: '',
          delivery_address: address.full_address || '',
          order_latitude: address.customer_latitude || '0',
          order_longitude: address.customer_longitude || '0',
          order_distance: 0,
          ext_del_charge: 0,
          sub_order_array: subOrderArray,
        });
        if (response.data?.status !== 200) {
          throw new Error(response.data?.message || 'Could not place order.');
        }
        dispatch(
          placePreviewOrder({
            ...order,
            id: response.data.order_id || order.id,
            realOrderId: response.data.id,
            realOrderIds: response.data.ids || [response.data.id],
          }),
        );
        resetToConfirmation(navigation, response.data.order_id || order.id);
      } catch (err) {
        placing.current = false;
        setPlacingLive(false);
        setOrderError(err.message || 'Please try again.');
      }
      return;
    }

    dispatch(placePreviewOrder(order));
    resetToConfirmation(navigation, order.id);
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
                            liveProduct: item,
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
                <BillRow label="Subtotal" value={money(amount - discount)} />
                {itemGst > 0 ? (
                  <BillRow label="GST included in items" value={money(itemGst)} />
                ) : null}
                <BillRow
                  label="Delivery Charge"
                  value={charges?.delivery > 0 ? money(charges.delivery) : 'FREE'}
                  blue={!(charges?.delivery > 0)}
                />
                {charges?.packing > 0 ? (
                  <BillRow label="Packing Charge" value={money(charges.packing)} />
                ) : null}
                {charges?.platform > 0 ? (
                  <BillRow label="Platform Fee" value={money(charges.platform)} />
                ) : null}
                {charges?.donation > 0 ? (
                  <BillRow label="Donation" value={money(charges.donation)} />
                ) : null}
                {charges?.surcharges > 0 ? (
                  <BillRow label="Surcharge" value={money(charges.surcharges)} />
                ) : null}
                <BillRow
                  label={
                    charges?.gst > 0
                      ? `GST on charges (${charges.gstPercent}%)`
                      : 'GST'
                  }
                  value={charges?.gst > 0 ? money(charges.gst) : 'Included'}
                />
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
              <Text style={s.green}>Saved {money(original - amount + discount)}</Text>
            </View>
            <GradientButton
              style={{minWidth: 150}}
              disabled={placingLive}
              onPress={checkout}
              label={
                placingLive
                  ? 'Placing order…'
                  : address
                  ? 'Place order'
                  : 'Choose address'
              }
            />
          </>
        ) : (
          <GradientButton
            style={{flex: 1}}
            onPress={() => navigation.navigate('Home', {screen: 'HomeTab'})}
            label="Continue shopping"
          />
        )}
      </Footer>
      <ConfirmDialog
        visible={Boolean(orderError)}
        hideCancel
        icon="error-outline"
        title="Order failed"
        message={orderError || ''}
        confirmLabel="OK"
        onConfirm={() => setOrderError(null)}
        onCancel={() => setOrderError(null)}
      />
    </Page>
  );
}

// Once an order is placed, drop Cart/Checkout/product screens from the stack so
// Back from the confirmation (or order details) lands on Home.
const resetToConfirmation = (navigation, orderId) =>
  navigation.reset({
    index: 1,
    routes: [
      {name: 'Home', params: {screen: 'HomeTab'}},
      {name: 'OrderConfirmation', params: {orderId}},
    ],
  });

export function OrderConfirmationScreen({navigation, route}) {
  const order = useSelector(state =>
    state.commerce.orders.find(item => item.id === route.params?.orderId),
  );
  const {width, height} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // The artwork is 393x852. Scale it to cover the whole window and pin it to the
  // bottom-centre so the waves stay visible on any aspect ratio.
  const backgroundScale = Math.max(width / 393, height / 852);
  useFocusEffect(
    useCallback(() => {
      if (!order?.id) return;
      const timer = setTimeout(
        () => navigation.replace('OrderDetails', {orderId: order.id}),
        2500,
      );
      return () => clearTimeout(timer);
    }, [navigation, order?.id]),
  );
  return (
    <Page>
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, {overflow: 'hidden', backgroundColor: '#F1F3FF'}]}>
        <Image
          source={require('../../assets/main/references/order-confirmed-background.png')}
          style={{
            position: 'absolute',
            bottom: 0,
            left: (width - 393 * backgroundScale) / 2,
            width: 393 * backgroundScale,
            height: 852 * backgroundScale,
          }}
          resizeMode="stretch"
          accessible={false}
        />
      </View>
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
        <View style={s.confirmSpacer} />
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
  const {orders: allOrders, refresh: refreshOrders} = useOrders();
  const auth = useSelector(state => state.Auth);
  const savedFeedback = useSelector(
    state => state.commerce.feedback[route.params?.orderId],
  );
  const foundOrder = allOrders.find(item => item.id === route.params?.orderId);
  const liveOrderItems = useLiveOrderItems(foundOrder);
  const order =
    foundOrder?.live && liveOrderItems
      ? {
          ...foundOrder,
          items: liveOrderItems,
          groups: foundOrder.groups.map(group => ({
            ...group,
            // only this category's items go under its shipment
            productIds: liveOrderItems
              .filter(item => String(item.orderRowId) === String(group.realOrderId))
              .map(item => item.id),
          })),
        }
      : foundOrder;
  // a live order's rating is what the server holds (set on its delivered shipments)
  const ratedGroup = foundOrder?.groups?.find(group => group.rating);
  const [rating, setRating] = useState(
    ratedGroup?.rating || savedFeedback?.rating || 0,
  );
  const [feedback, setFeedback] = useState(
    ratedGroup?.ratingComment || savedFeedback?.text || '',
  );
  const [saved, setSaved] = useState(Boolean(ratedGroup));
  const [feedbackError, setFeedbackError] = useState('');
  // the order can arrive after this screen mounts; take the server's rating when it does
  useEffect(() => {
    if (ratedGroup) {
      setRating(ratedGroup.rating);
      setFeedback(ratedGroup.ratingComment || '');
      setSaved(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratedGroup?.rating, ratedGroup?.ratingComment]);
  const [cancelling, setCancelling] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(null);
  // the shipments (order rows) the open confirm dialog will cancel
  const [cancelTarget, setCancelTarget] = useState(null);
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
  // a shipment can be cancelled only while it is still Placed (not yet accepted by the shop)
  const deliveredGroups = order.live
    ? order.groups.filter(group => shipmentStatus(group, order) === 'Delivered')
    : [];
  const cancellableGroups = order.live
    ? order.groups.filter(group => shipmentStatus(group, order) === 'Placed')
    : [];
  const ids = groups.flatMap(group => group.productIds);
  const items = order.items
    ? order.items.filter(item => ids.includes(item.id))
    : [];
  const address = order.address || auth.deliveryAddress;
  // The bill covers the shipments that are still going ahead: a cancelled shipment's items and
  // charges are not billed (unless every shipment was cancelled, when the whole order is shown).
  const billable = groups.filter(group => shipmentStatus(group, order) !== 'Cancelled');
  const billGroups = billable.length ? billable : groups;
  const billIds = billGroups.flatMap(group => group.productIds);
  const billItems = order.items
    ? order.items.filter(item => billIds.includes(item.id))
    : [];
  const someCancelled = billable.length > 0 && billable.length < groups.length;
  const amount = billItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const original = billItems.reduce(
    (sum, item) => sum + item.originalPrice * item.quantity,
    0,
  );
  // GST already inside the item prices (price x rate / (100 + rate))
  const itemGst = billItems.reduce(
    (sum, item) => sum + includedGst(item.price * item.quantity, item.gstPercent),
    0,
  );
  const discount = order.live
    ? billGroups.reduce((sum, group) => sum + (group.coupon || 0), 0)
    : route.params?.groupName
    ? 0
    : order.couponDiscount || 0;
  const billCharges = order.live
    ? billGroups.reduce(
        (total, group) => {
          const c = group.charges || {};
          Object.keys(total).forEach(key => {
            total[key] += c[key] || 0;
          });
          return total;
        },
        {delivery: 0, packing: 0, platform: 0, donation: 0, surcharges: 0, gst: 0},
      )
    : route.params?.groupName
    ? null
    : order.charges;
  const chargeSum = billCharges
    ? billCharges.delivery +
      billCharges.packing +
      billCharges.platform +
      billCharges.donation +
      billCharges.surcharges +
      billCharges.gst
    : 0;
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
        {order.live && order.status === 'Cancelled' && order.cancelReason ? (
          <Section>
            <Text style={s.bold}>Order cancelled</Text>
            <Text style={s.muted}>{order.cancelReason}</Text>
          </Section>
        ) : null}
        {cancellableGroups.length ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel this order"
            disabled={cancelling}
            onPress={() => {
              setCancelTarget({
                ids: cancellableGroups.map(group => group.realOrderId),
                name:
                  cancellableGroups.length === order.groups.length
                    ? null
                    : cancellableGroups.map(group => group.name).join(', '),
              });
              setCancelDialog('confirm');
            }}
            style={[s.cancelOrder, cancelling && {opacity: 0.6}]}>
            <MaterialIcons name="highlight-off" size={20} color="#BC3C47" />
            <Text style={s.cancelOrderText}>
              {cancelling
                ? 'Cancelling...'
                : cancellableGroups.length === order.groups.length
                ? 'Cancel entire order'
                : 'Cancel remaining items'}
            </Text>
          </Pressable>
        ) : null}
        {groups.map(group => (
          <OrderShipment
            key={group.id || group.name}
            group={group}
            order={order}
            items={items}
            navigation={navigation}
            onRateItem={(item, value) =>
              rateLiveOrderItem({
                orderItemId: item.orderItemId,
                customerId: auth.customerId,
                rating: value,
              })
            }
            onCancel={target => {
              setCancelTarget({ids: [target.realOrderId], name: target.name});
              setCancelDialog('confirm');
            }}
          />
        ))}
        {!order.live || deliveredGroups.length ? (
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
          {feedbackError ? (
            <Text style={[s.muted, {textAlign: 'center', color: '#BC3C47'}]}>
              {feedbackError}
            </Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            disabled={!rating}
            onPress={async () => {
              setFeedbackError('');
              if (order.live) {
                // the rating is stored on each delivered shipment of the order
                let done = false;
                try {
                  done = await rateLiveShipments(
                    deliveredGroups.map(group => group.realOrderId),
                    {
                      customerId: auth.customerId,
                      rating,
                      comment: feedback.trim(),
                    },
                  );
                } catch (error) {
                  done = false;
                }
                if (!done) {
                  setFeedbackError('Could not save your feedback. Please try again.');
                  return;
                }
                refreshOrders();
              }
              dispatch(
                saveOrderFeedback({
                  orderId: order.id,
                  rating,
                  text: feedback.trim(),
                }),
              );
              setSaved(true);
            }}
            style={[s.feedbackSave, !rating && {opacity: 0.4}]}>
            <Text style={s.blue}>
              {saved ? 'Feedback saved' : 'Save feedback'}
            </Text>
          </Pressable>
        </Section>
        ) : null}
        <Section title="Shipping Details">
          <InfoRow
            icon="person-outline"
            label="NAME"
            value={address?.customer_name || auth.customerName || ''}
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
          {someCancelled ? (
            <Text style={[s.muted, {marginTop: 0, marginBottom: 6}]}>
              Cancelled items are not included.
            </Text>
          ) : null}
          <BillRow label="Items total" value={money(original)} />
          <BillRow
            label="Savings"
            value={`−${money(original - amount)}`}
            blue
          />
          <BillRow label="Coupon discount" value={`−${money(discount)}`} blue />
          <View style={s.divider}>
            <BillRow label="Subtotal" value={money(amount - discount)} />
            {itemGst > 0 ? (
              <BillRow label="GST included in items" value={money(itemGst)} />
            ) : null}
            <BillRow
              label="Delivery charge"
              value={billCharges?.delivery > 0 ? money(billCharges.delivery) : 'FREE'}
            />
            {billCharges?.packing > 0 ? (
              <BillRow label="Packing charge" value={money(billCharges.packing)} />
            ) : null}
            {billCharges?.platform > 0 ? (
              <BillRow label="Platform fee" value={money(billCharges.platform)} />
            ) : null}
            {billCharges?.donation > 0 ? (
              <BillRow label="Donation" value={money(billCharges.donation)} />
            ) : null}
            {billCharges?.surcharges > 0 ? (
              <BillRow label="Surcharge" value={money(billCharges.surcharges)} />
            ) : null}
            {billCharges?.gst > 0 ? (
              <BillRow label="GST on charges" value={money(billCharges.gst)} />
            ) : null}
          </View>
          <View style={s.divider}>
            <BillRow
              label="TOTAL"
              value={money(amount - discount + chargeSum)}
              strong
            />
          </View>
        </Section>
      </ScrollView>
      <ConfirmDialog
        visible={cancelDialog === 'confirm'}
        danger
        icon="highlight-off"
        title={cancelTarget?.name ? `Cancel ${cancelTarget.name}?` : 'Cancel entire order?'}
        message={
          cancelTarget?.name
            ? 'Only these items are cancelled; the rest of the order continues. You can cancel only before the shop accepts it.'
            : 'All items in this order will be cancelled. You can cancel only before the shop accepts it.'
        }
        confirmLabel="Yes, cancel"
        cancelLabel="Keep order"
        onCancel={() => setCancelDialog(null)}
        onConfirm={async () => {
          const target = cancelTarget;
          setCancelDialog(null);
          setCancelling(true);
          try {
            const {cancelled, total} = await cancelLiveOrder(target.ids, {
              customerId: auth.customerId,
            });
            refreshOrders();
            if (cancelled === total) {
              setCancelDialog('done');
            } else if (cancelled > 0) {
              setCancelDialog('partial');
            } else {
              setCancelDialog('accepted');
            }
          } catch (err) {
            setCancelDialog('failed');
          }
          setCancelling(false);
        }}
      />
      <ConfirmDialog
        visible={['done', 'partial', 'accepted', 'failed'].includes(cancelDialog)}
        hideCancel
        icon={cancelDialog === 'done' ? 'check-circle-outline' : 'info-outline'}
        title={
          cancelDialog === 'done'
            ? 'Cancelled'
            : cancelDialog === 'partial'
            ? 'Partly cancelled'
            : cancelDialog === 'accepted'
            ? 'Cannot cancel'
            : 'Could not cancel'
        }
        message={
          cancelDialog === 'done'
            ? 'Your cancellation has been placed.'
            : cancelDialog === 'partial'
            ? 'Some items were cancelled. The shop has already accepted the rest.'
            : cancelDialog === 'accepted'
            ? 'The shop has already accepted this order.'
            : 'Please try again.'
        }
        confirmLabel="OK"
        onConfirm={() => setCancelDialog(null)}
        onCancel={() => setCancelDialog(null)}
      />
    </Page>
  );
}

const s = StyleSheet.create({
  content: {paddingHorizontal: 16, paddingTop: 8, paddingBottom: 86},
  // full width like the cards around it (the list already pads 16 each side)
  cancelOrder: {
    marginTop: 16,
    marginBottom: 2,
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5B3B8',
    backgroundColor: '#FFF0F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cancelOrderText: {fontSize: 15, fontWeight: '700', color: '#BC3C47'},
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
    paddingHorizontal: 28,
    paddingTop: 72,
  },
  confirmSpacer: {flexGrow: 1, minHeight: 28},
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
