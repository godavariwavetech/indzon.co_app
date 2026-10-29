// Live-data adapter for the commerce catalog. Maps real backend rows into the
// exact shape src_new/config/catalog.js already uses, so screens that render
// `category.art`/`shop.*`/`product.*` need no changes to their JSX — only the
// data source changes. See ReferenceArtwork.jsx: `art.source` is passed
// straight to <Image>, so a {uri} works exactly like a local require().
import {useCallback, useEffect, useState} from 'react';
import {AppState} from 'react-native';
import {useSelector} from 'react-redux';
import {useFocusEffect} from '@react-navigation/native';
import api from '../utils/api';
import {baseURL, endpoints} from '../config/config';
import {ENABLE_LIVE_DATA} from '../config/appMode';
import {createLiveItemCache} from './liveItemCache';
import {startForegroundPolling} from './foregroundPolling';

// The backend stores media URLs with whatever dev IP it was seeded under
// (e.g. http://192.168.0.111:2406/images/...). Point any such local-server URL
// at the host the app is actually configured to use, so a changed LAN IP
// never breaks images.
const LOCAL_MEDIA = /^https?:\/\/(?:\d{1,3}(?:\.\d{1,3}){3}|localhost):2406\//;
export const mediaUrl = url =>
  typeof url === 'string' && LOCAL_MEDIA.test(url)
    ? url.replace(LOCAL_MEDIA, baseURL)
    : url;

// Every catalog picture (categories, subcategories, products, banners, shops) is served
// by the backend; the app bundles none of them.
const categoryArt = url => ({
  source: {uri: mediaUrl(url)},
  background: require('../assets/main/references/category-background.png'),
  resizeMode: 'contain',
});

const photoArt = url => ({
  source: {uri: mediaUrl(url)},
  borderRadius: 10,
  resizeMode: 'contain',
  aspectRatio: 1,
});

// A product saved with variants (size, colour, storage...) is several rows sharing a
// unique_code. Lists show it once, as its cheapest variant; the details screen
// offers the rest.
export function groupVariants(items) {
  const best = new Map();
  const order = [];
  items.forEach(item => {
    const key = item.uniqueCode
      ? `${item.shopItemsTableName}:${item.uniqueCode}`
      : item.id;
    if (!best.has(key)) {
      best.set(key, item);
      order.push(key);
    } else if (item.price < best.get(key).price) {
      best.set(key, item);
    }
  });
  return order.map(key => best.get(key));
}

export async function getLiveCategories() {
  const response = await api.post(endpoints.DADDY_GET_CATEGORIES, {});
  if (Number(response.data?.status) !== 200 || !Array.isArray(response.data?.data)) {
    throw new Error('Could not load categories.');
  }
  const rows = Array.isArray(response.data?.data) ? response.data.data : [];
  // category_active_status 0 = active (the API already filters; this guards
  // against rows that do carry the flag); rows without the field are kept.
  return rows
    .filter(
      row =>
        row.category_active_status == null ||
        Number(row.category_active_status) === 0,
    )
    .map(row => ({
      id: String(row.id),
      name: row.category_name,
      shortName: row.category_name,
      art: categoryArt(row.category_image),
      icon: 'shopping-basket',
      shopItemsTableName: row.shop_items_tb_nm,
      // category_tbl.highlight: set on the dashboard to feature a category under "Top Deals".
      highlight: Number(row.highlight) === 1,
      subcategories: [],
    }));
}

export async function getLiveBanners({locationId}) {
  const response = await api.post(endpoints.GET_BANNER, {
    location_id: Number(locationId),
  });
  const rows = Array.isArray(response.data?.data) ? response.data.data : [];
  return rows
    .filter(row => row.banner_image)
    .map(row => ({
      id: String(row.id),
      uri: mediaUrl(row.banner_image),
      // banner_image2 is the picture sized for the offer-card carousel.
      cardUri: mediaUrl(row.banner_image2) || mediaUrl(row.banner_image),
      title: row.banner_offer_title,
      categoryId: row.category_id ? String(row.category_id) : null,
      // banner_type: 0 = home banner, 1 = offer banner, 2 = header banner.
      type: Number(row.banner_type) || 0,
    }));
}

// An address saved before a service area matched (or in the old static flow)
// carries no location_id, which empties every catalog screen. Re-resolve it
// from the stored coordinates.
export async function resolveServiceLocation({latitude, longitude}) {
  const response = await api.post(endpoints.CHECK_ADDRESS_EXISTENCE, {
    location_latitude: latitude,
    location_longitude: longitude,
  });
  const match = response.data?.data?.available_locations?.[0];
  return match ? {id: match.id, name: match.location_name} : null;
}

const SUBCATEGORY_COLORS = [
  '#F5DFCF',
  '#FCE8EF',
  '#FDE9DA',
  '#EFE7CB',
  '#FBDDE3',
  '#E5F1D6',
  '#E4E5FA',
  '#F1E4F8',
];

// Subcategories of a category in a service area. Each row also carries the ids
// of the shops that stock it (shop_id is a GROUP_CONCAT), which the product
// list needs to know whose items to load.
export async function getLiveSubcategories({categoryId, locationId}) {
  const response = await api.post(endpoints.GET_SUB_CATEGORIES, {
    category_id: Number(categoryId),
    location_id: Number(locationId),
    veg_mode: 0,
  });
  const rows = Array.isArray(response.data?.data) ? response.data.data : [];
  return rows.map((row, index) => ({
    id: String(row.sub_category_id),
    name: row.sub_category_name,
    tagLine: row.subcategory_tag_line,
    shopIds: String(row.shop_id || '')
      .split(',')
      .filter(Boolean),
    color: SUBCATEGORY_COLORS[index % SUBCATEGORY_COLORS.length],
    art: photoArt(row.sub_category_image),
  }));
}

export async function getLiveShops({categoryId, locationId, coordinates}) {
  const response = await api.post(endpoints.GET_SHOPS, {
    shop_id: 0,
    category_id: Number(categoryId),
    location_id: Number(locationId),
    veg_mode: 0,
    shop_latitude: coordinates?.latitude ?? 0,
    shop_longitude: coordinates?.longitude ?? 0,
  });
  const [rows] = Array.isArray(response.data?.data) ? response.data.data : [[]];
  return (rows || []).map(row => ({
    id: String(row.shop_id),
    categoryId: String(row.category_id),
    name: row.shop_name,
    address: row.shop_address,
    rating: row.shop_rating,
    minimumOrder: Number(row.minimum_order) || 0,
    shopItemsTableName: row.shop_items_tb_nm,
    art: photoArt(row.shop_image),
  }));
}

export async function getLiveItems({shopItemsTableName, shopId}) {
  const response = await api.post(endpoints.GET_ITEMS_LIST, {
    shop_items_tb_nm: shopItemsTableName,
    shop_id: Number(shopId),
  });
  const rows = Array.isArray(response.data?.data) ? response.data.data : [];
  return rows.map(row => mapLiveItem(row, shopItemsTableName));
}

// Best-value products across all categories for the home "Suggested for you" row.
export async function getSuggestedProducts({limit = 12, locationId} = {}) {
  const response = await api.post(endpoints.GET_SUGGESTED_PRODUCTS, {
    limit,
    location_id: Number(locationId) || 0,
  });
  const rows = Array.isArray(response.data?.data) ? response.data.data : [];
  return groupVariants(rows.map(row => mapLiveItem(row, row.shop_items_tb_nm)));
}

// Delivery, packing, platform fee, donation and gst for a cart, from the dashboard's settings.
// items: [{shopId, total}] (total = price x quantity).
export async function getOrderCharges({locationId, coordinates, items}) {
  const response = await api.post(endpoints.GET_ORDER_CHARGES, {
    location_id: Number(locationId) || 0,
    latitude: coordinates?.latitude,
    longitude: coordinates?.longitude,
    items: items.map(item => ({
      shop_id: item.shopId,
      item_total_amount: item.total,
    })),
  });
  const data = response.data?.data;
  if (response.data?.status !== 200 || !data) {
    throw new Error('Could not calculate charges.');
  }
  return {
    delivery: data.totals.delivery_charges,
    packing: data.totals.packing_charges,
    platform: data.totals.handling_charges,
    donation: data.totals.donation_charges,
    surcharges: data.totals.surcharges,
    gst: data.totals.gst,
    gstPercent: data.gst_percentage,
    total: data.totals.total_charges,
    perShop: data.shops,
    raw: data,
  };
}

// "Top Deals" and "Suggested for you" for the home screen, from one call.
export async function getHomeSections({locationId} = {}) {
  const response = await api.post(endpoints.GET_HOME_SECTIONS, {
    location_id: Number(locationId) || 0,
  });
  const data = response.data?.data || {};
  const items = rows =>
    (Array.isArray(rows) ? rows : []).map(row =>
      mapLiveItem(row, row.shop_items_tb_nm),
    );
  return {
    highlightedCategories: (Array.isArray(data.highlighted_categories)
      ? data.highlighted_categories
      : []
    ).map(row => ({
      id: String(row.id),
      name: row.category_name,
      art: categoryArt(row.category_image),
    })),
    topDeals: groupVariants(items(data.top_deals)),
    suggested: groupVariants(items(data.suggested)),
  };
}

// The dashboard saves attributes / variant_options / item_images as JSON text.
const parseJson = value => {
  if (value && typeof value === 'object') {
    return value;
  }
  try {
    return value ? JSON.parse(value) : null;
  } catch (error) {
    return null;
  }
};

// Variant records can include prices and SKUs; only their size is display text.
const displayValue = value => {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(displayValue).filter(Boolean).join(', ');
  }
  if (value && typeof value === 'object') {
    return displayValue(value.size);
  }
  return '';
};

// Dashboard-entered details of one item row: gallery, specs (material, warranty,
// ...) and this row's variant (size, colour, storage, ...).
function itemDetails(row) {
  const gallery = parseJson(row.item_images);
  const images = [row.item_image, ...(Array.isArray(gallery) ? gallery : [])]
    .filter(Boolean)
    .map(mediaUrl);
  const toEntries = value =>
    Object.entries(parseJson(value) || {}).map(([key, entry]) => [
      key,
      displayValue(entry),
    ]).filter(
      ([key, entry]) =>
        entry !== null && entry !== '' && !['qa_batch', 'image_type', 'color_hex'].includes(key),
    );
  return {
    images: [...new Set(images)].map(uri => ({uri})),
    attributes: toEntries(row.attributes),
    variantOptions: toEntries(row.variant_options),
    uniqueCode: row.unique_code,
  };
}

function mapLiveItem(row, shopItemsTableName) {
  return {
    ...itemDetails(row),
    // Each shop_items_tb_nm table has its own independent auto-increment id,
    // so a bare numeric id can collide across shops/categories once used as
    // a cart/wishlist key — keep it globally unique.
    id: `${shopItemsTableName}:${row.id}`,
    itemId: row.id,
    shopItemsTableName,
    shopId: String(row.shop_id),
    categoryId: String(row.category_id),
    subcategoryId: String(row.sub_category_id),
    subcategoryName: row.sub_category_name,
    name: row.item_name,
    description: row.item_description,
    brand: row.brand,
    price: Number(row.selling_price) || 0,
    originalPrice: Number(row.actual_price) || Number(row.selling_price) || 0,
    unit: displayValue(parseJson(row.quantity_varient) || row.quantity_varient) || '1 item',
    gstPercent: Number(row.item_gst) || 0,
    art: photoArt(row.item_image),
    // average of the customers' ratings of this item; null until someone rates it
    rating: Number(row.item_rating) || null,
    reviewCount: Number(row.item_rating_count) || 0,
  };
}

// Resolves a single live item back to its full row — needed because cart/
// wishlist only ever store an id, and there's no per-shop list endpoint that
// takes an id alone. GET_RESULT_FULL_DATA (searchitemsfull) is a generic
// "SELECT * FROM <table> WHERE id = ?" the backend already exposes for this.
export async function getLiveItemById(compoundId, locationId) {
  const [shopItemsTableName, itemId] = String(compoundId).split(':');
  if (!shopItemsTableName || !itemId) {
    return null;
  }
  const response = await api.post(endpoints.GET_RESULT_FULL_DATA, {
    table_name: shopItemsTableName,
    id: itemId,
    location_id: Number(locationId) || 0,
  });
  if (Number(response.data?.status) !== 200 || !Array.isArray(response.data?.data)) {
    throw new Error('Could not check the latest product prices. Please try again.');
  }
  const row = Array.isArray(response.data?.data) ? response.data.data[0] : null;
  if (!row) {
    return null;
  }
  return {
    ...itemDetails(row),
    id: compoundId,
    itemId: row.id,
    shopItemsTableName,
    shopId: String(row.shop_id),
    categoryId: String(row.category_id),
    subcategoryId: String(row.sub_category_id),
    subcategoryName: row.sub_category_name,
    name: row.item_name,
    description: row.item_description,
    brand: row.brand,
    price: Number(row.selling_price) || 0,
    originalPrice: Number(row.actual_price) || Number(row.selling_price) || 0,
    unit: displayValue(parseJson(row.quantity_varient) || row.quantity_varient) || '1 item',
    gstPercent: Number(row.item_gst) || 0,
    art: photoArt(row.item_image),
  };
}

export async function searchAll(term, locationId) {
  const response = await api.post(endpoints.GLOBAL_SEARCH, {
    searchterm: term,
    location_id: locationId,
  });
  const rows = Array.isArray(response.data?.data) ? response.data.data : [];
  return rows.map(row => {
    const base = {
      key: `${row.search_type}-${row.table_name}-${row.id}`,
      type: row.search_type,
      name: row.search_text,
      tagline: row.search_tagline,
    };
    if (row.search_type === '1') {
      return {
        ...base,
        kind: 'item',
        art: photoArt(row.search_image),
        product: {
          id: `${row.table_name}:${row.id}`,
          itemId: row.id,
          shopItemsTableName: row.table_name,
          shopId: String(row.extra_a),
          name: row.search_text,
          price: Number(row.extra_b) || 0,
          originalPrice: Number(row.extra_b) || 0,
          unit: '1 item',
          art: photoArt(row.search_image),
        },
      };
    }
    if (row.search_type === '2') {
      return {
        ...base,
        kind: 'shop',
        shopId: String(row.id),
        shopItemsTableName: row.extra_a,
        art: photoArt(row.search_image),
      };
    }
    return {
      ...base,
      kind: 'category',
      categoryId: String(row.id),
      art: categoryArt(row.search_image),
    };
  });
}

const isLiveId = id => typeof id === 'string' && id.includes(':');

// Cart/wishlist only ever store an id — this resolves the live ones (ids
// containing ':') back to full product objects for rendering, caching across
// calls so re-rendering the same cart/wishlist doesn't refetch every item.
const itemCache = createLiveItemCache(getLiveItemById);
export const refreshLiveItems = (ids, locationId) =>
  itemCache.refresh(ENABLE_LIVE_DATA ? ids.filter(isLiveId) : [], locationId);
export function useLiveItemsByIds(ids) {
  const [, forceRender] = useState(0);
  const [loading, setLoading] = useState(false);
  const locationId = useSelector(state => state.Auth.locationId);
  const liveIds = ENABLE_LIVE_DATA ? ids.filter(isLiveId) : [];
  const idsKey = [...new Set(liveIds)].sort().join(',');
  useEffect(() => itemCache.subscribe(() => forceRender(n => n + 1)), []);
  useFocusEffect(useCallback(() => {
    if (!idsKey) { return undefined; }
    let active = true;
    setLoading(true);
    refreshLiveItems(idsKey.split(','), locationId)
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [idsKey, locationId]));
  const itemsById = {};
  liveIds.forEach(id => {
    const item = itemCache.get(id, locationId);
    if (item) {
      itemsById[id] = item;
    }
  });
  return {itemsById, loading: liveIds.length > 0 && loading};
}

// categoryId / shopId null lists every coupon of the location.
export async function getLiveCoupons({locationId, categoryId = 0, shopId = 0}) {
  const response = await api.post(endpoints.GET_COUPONS, {
    location_id: locationId,
    coupon_category_id: categoryId,
    shop_id: shopId,
  });
  if (Number(response.data?.status) !== 200 || !Array.isArray(response.data?.data)) {
    throw new Error('Could not verify current coupons. Please try again.');
  }
  const rows = Array.isArray(response.data?.data) ? response.data.data : [];
  return rows.filter(row =>
    (row.d_in == null || Number(row.d_in) === 0) &&
    (row.coupon_active_status == null || Number(row.coupon_active_status) === 0),
  ).map(row => ({
    id: row.id,
    code: row.coupon_name,
    label: Number(row.coupon_user_permission) ? 'ONE-TIME' : 'FLAT',
    badge: Number(row.coupon_percentage) ? `${row.coupon_percentage}%` : `₹${row.coupon_upto_price}`,
    title: Number(row.coupon_percentage)
      ? `Get ${row.coupon_percentage}% OFF`
      : `Flat ₹${row.coupon_upto_price} OFF`,
    caption:
      row.coupon_description ||
      (Number(row.coupon_max_price_limit)
        ? `on orders above ₹${row.coupon_max_price_limit}`
        : 'on your order'),
    action: 'Apply',
    percent: Number(row.coupon_percentage) || 0,
    cap: Number(row.coupon_upto_price) || 0,
    minBill: Number(row.coupon_max_price_limit) || 0,
    categoryId: row.category_id ? String(row.category_id) : null,
    // a coupon tied to one shop only applies to that shop's items
    shopId: row.shop_id ? String(row.shop_id) : null,
  }));
}

// Every offer for the service area, whatever category it belongs to, so the
// coupons screen can list them all (the endpoint filters by one category at a time).
export function getAllLiveCoupons({locationId}) {
  return getLiveCoupons({locationId, categoryId: null, shopId: null});
}

export function evaluateLiveCoupon(code, offers, items) {
  const offer = offers.find(
    o => o.code.toUpperCase() === String(code || '').trim().toUpperCase(),
  );
  if (!offer) {
    return {discount: 0, error: 'Enter a valid coupon code.'};
  }
  if (!items.length) {
    return {discount: 0, error: 'Add items to your cart before applying a coupon.'};
  }
  const eligible = items.filter(
    item =>
      (!offer.categoryId || offer.categoryId === '0' ||
        String(item.categoryId) === offer.categoryId) &&
      (!offer.shopId || String(item.shopId) === offer.shopId),
  );
  const amount = eligible.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (!amount) {
    return {discount: 0, error: 'This coupon does not apply to items in your cart.'};
  }
  if (amount < offer.minBill) {
    return {
      discount: 0,
      error: `Add ₹${(offer.minBill - amount).toFixed(0)} more to use this coupon.`,
    };
  }
  // a percentage coupon is capped; a flat coupon (no percentage) takes its flat amount off
  const pctAmount = (amount * offer.percent) / 100;
  const discount = offer.percent
    ? offer.cap > 0
      ? Math.min(pctAmount, offer.cap)
      : pctAmount
    : Math.min(offer.cap, amount);
  return {discount: Math.round(discount * 100) / 100, error: null, code: offer.code};
}

// Syncs a wishlist toggle to the real backend (addwishlist/getuserwishlist/
// deletewishlist) in addition to the local commerce.wishlist bookkeeping.
// Fire-and-forget from the caller's point of view — local state is the
// source of truth for what's shown; this just keeps the server in sync.
export async function toggleLiveWishlist({customerId, locationId, item, wished}) {
  if (!customerId || !item?.itemId || !item?.shopItemsTableName) {
    return;
  }
  if (wished) {
    await api.post(endpoints.ADD_WISHLIST, {
      location_id: locationId,
      wishlist_id: item.itemId,
      wishlist_type: 1,
      table_name: item.shopItemsTableName,
      customer_id: customerId,
      shop_id: item.shopId,
    });
    return;
  }
  const listResponse = await api.post(endpoints.GET_USER_WISHLIST, {
    customer_id: customerId,
    shop_id: item.shopId,
  });
  const rows = Array.isArray(listResponse.data?.data) ? listResponse.data.data : [];
  const match = rows.find(row => String(row.wishlist_id) === String(item.itemId));
  if (match) {
    await api.post(endpoints.DELETE_WISHLIST, {id: match.id});
  }
}

export const liveCatalogEnabled = ENABLE_LIVE_DATA;

// order_lst_t.order_status codes as used by the vendor/admin dashboards:
// 0,1,2,8 are in progress, 3 delivered, 5 rejected/cancelled (7 is hidden by
// the API). The in-between names are mapped onto the app's shipment stages.
const ORDER_STATUS = {
  0: 'Placed',
  1: 'Confirmed',
  8: 'Packed',
  2: 'Out for delivery',
  3: 'Delivered',
  // 5 is the dashboards' cancelled/rejected; 4 is what older customer cancels saved
  4: 'Cancelled',
  5: 'Cancelled',
};

const emptyCharges = () => ({
  delivery: 0,
  packing: 0,
  platform: 0,
  donation: 0,
  surcharges: 0,
  gst: 0,
});
// What an order row (one per category) charged on top of its items.
function addCharges(charges, row) {
  charges.delivery += Number(row.delivery_charges) || 0;
  charges.packing += Number(row.packing_charges) || 0;
  charges.platform += Number(row.handling_charges) || 0;
  charges.donation += Number(row.donation_charges) || 0;
  charges.surcharges += Number(row.surcharges) || 0;
  charges.gst +=
    (Number(row.delivery_charges_gst) || 0) +
    (Number(row.packing_charges_gst) || 0) +
    (Number(row.gstonplatform_fee) || 0);
  return charges;
}

export async function getLiveOrders({customerId}) {
  const response = await api.post(endpoints.GET_ORDERS, {
    customer_id: customerId,
    order_id: 0,
  });
  const rows = Array.isArray(response.data?.data) ? response.data.data : [];
  // An order is stored as one row per category (same order_id, own row id); show it as one order
  // with a shipment per category.
  const orders = new Map();
  rows.forEach(row => {
    const status = ORDER_STATUS[row.order_status] || 'Confirmed';
    const price = Number(row.grand_total) || 0;
    const originalPrice = Number(row.actual_total_amount) || price;
    const count = Number(row.item_count) || 0;
    const group = {
      id: `shipment-${row.id}`,
      realOrderId: row.id,
      categoryId: String(row.category_id),
      status,
      tracking: [
        {status: 'Placed', at: row.order_date_time},
        row.accept_order_date_time && {
          status: 'Confirmed',
          at: row.accept_order_date_time,
        },
        row.order_deliverd_date_time && {
          status: 'Delivered',
          at: row.order_deliverd_date_time,
        },
      ].filter(Boolean),
      // the customer sees the category, never the shop behind it
      name: row.category_name || 'Order',
      count,
      price,
      originalPrice,
      productIds: [],
      shopId: String(row.shop_id),
      // what this shipment (one order row) charged on top of its items, and its coupon share,
      // so a cancelled shipment can be left out of the bill
      charges: addCharges(emptyCharges(), row),
      coupon: Number(row.coupon_amount) || 0,
      // the customer's rating of this delivered shipment (0 = not rated yet)
      rating: Number(row.order_rating_status) || 0,
      ratingComment: row.rating_comment || '',
      cancelReason: row.order_cancel_msg || null,
      // set once a delivery partner has been assigned to the order
      deliveryPartner: row.delivery_boy_name
        ? {
            name: row.delivery_boy_name,
            phone: row.delivery_boy_mobile_number,
            rating: Number(row.delivery_boy_rating) || null,
            photo: row.delivery_boy_image ? mediaUrl(row.delivery_boy_image) : null,
          }
        : null,
    };
    const existing = orders.get(String(row.order_id));
    if (existing) {
      existing.realOrderIds.push(row.id);
      existing.count += count;
      existing.price += price;
      existing.originalPrice += originalPrice;
      existing.couponDiscount += Number(row.coupon_amount) || 0;
      existing.savings += Number(row.total_saving_amount) || 0;
      addCharges(existing.charges, row);
      existing.groups.push(group);
      return;
    }
    orders.set(String(row.order_id), {
      id: String(row.order_id),
      realOrderId: row.id,
      realOrderIds: [row.id],
      live: true,
      placed: row.order_date_time || row.order_date,
      status,
      cancelReason: row.order_cancel_msg || null,
      address: {full_address: row.delivery_address},
      count,
      price,
      originalPrice,
      couponDiscount: Number(row.coupon_amount) || 0,
      savings: Number(row.total_saving_amount) || 0,
      charges: addCharges(emptyCharges(), row),
      groups: [group],
    });
  });
  // The order's own status follows its shipments: Cancelled only when every
  // shipment is, otherwise the first one still in progress.
  orders.forEach(order => {
    const active = order.groups.filter(group => group.status !== 'Cancelled');
    order.status = active.length ? active[0].status : 'Cancelled';
    order.cancelReason =
      order.groups.find(group => group.cancelReason)?.cancelReason || null;
  });
  return Array.from(orders.values());
}

// A shipment (one order row per category) can be cancelled while it is still
// "Placed"; the backend answers status 300 once the shop has accepted it.
// Resolves to how many of the given rows were actually cancelled.
export async function cancelLiveOrder(realOrderIds, {customerId, reason} = {}) {
  const ids = [].concat(realOrderIds);
  const results = await Promise.all(
    ids.map(id =>
      api
        .post(endpoints.CANCEL_ORDER, {
          order_id: id,
          customer_id: customerId,
          cancel_reason: reason || 'Cancelled by customer',
        })
        .then(response => response.data?.status === 200)
        .catch(() => false),
    ),
  );
  return {cancelled: results.filter(Boolean).length, total: ids.length};
}

// Rating needs a delivered shipment; the backend answers status 300 otherwise.
export async function rateLiveShipments(realOrderIds, {customerId, rating, comment}) {
  const results = await Promise.all(
    [].concat(realOrderIds).map(id =>
      api
        .post(endpoints.GIVE_ORDER_RATING, {
          usr_id: customerId,
          order_id: id,
          rating,
          comment,
        })
        .then(response => response.data?.status === 200)
        .catch(() => false),
    ),
  );
  return results.some(Boolean);
}

export async function rateLiveOrderItem({orderItemId, customerId, rating, comment}) {
  const response = await api.post(endpoints.GIVE_ITEM_RATING, {
    customer_id: customerId,
    order_item_id: orderItemId,
    rating,
    comment,
  });
  return response.data?.status === 200;
}

export async function getLiveOrderItems(realOrderId) {
  const response = await api.post(endpoints.GET_ORDER_DETAILS, {
    order_id: realOrderId,
  });
  const rows = Array.isArray(response.data?.data) ? response.data.data : [];
  return rows.map(row => ({
    id: `order-item:${row.id}`,
    // the order_lst_t row (one per category) this item belongs to
    orderRowId: realOrderId,
    itemId: row.item_id,
    orderItemId: row.id,
    gstPercent: Number(row.item_gst) || 0,
    myRating: Number(row.my_rating) || 0,
    myComment: row.my_comment || '',
    name: row.item_name,
    unit: displayValue(parseJson(row.quantity_varient) || row.quantity_varient) || '1 item',
    price: Number(row.item_price) || 0,
    originalPrice: Number(row.actualitem_price) || Number(row.item_price) || 0,
    quantity: Number(row.sub_item_count) || 1,
    art: photoArt(row.item_image),
  }));
}

// Orders from the backend (the source of truth) plus any placed in this
// session that the server has not returned yet. Refetched whenever the
// screen regains focus, so a fresh order shows up after checkout.
export function useOrders({pollInterval = 0} = {}) {
  const customerId = useSelector(state => state.Auth.customerId);
  const localOrders = useSelector(state => state.commerce.orders);
  const [liveOrders, setLiveOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(Boolean(ENABLE_LIVE_DATA && customerId));
  useFocusEffect(
    useCallback(() => {
      if (!ENABLE_LIVE_DATA || !customerId) {
        return undefined;
      }
      return startForegroundPolling({
        load: () => getLiveOrders({customerId}),
        onSuccess: setLiveOrders,
        onSettled: () => {
          setRefreshing(false);
          setLoading(false);
        },
        intervalMs: pollInterval,
        appState: AppState,
      });
    // refreshKey re-runs the fetch on pull-to-refresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [customerId, refreshKey, pollInterval]),
  );
  const liveIds = new Set(liveOrders.map(order => order.id));
  return {
    orders: [
      ...liveOrders,
      ...localOrders.filter(order => !liveIds.has(order.id)),
    ],
    refreshing,
    loading,
    refresh: () => {
      setRefreshing(true);
      setRefreshKey(key => key + 1);
    },
  };
}

export function useAllOrders() {
  return useOrders().orders;
}

export function useLiveOrderItems(order) {
  const [items, setItems] = useState(null);
  const realOrderKey = order?.live
    ? (order.realOrderIds || [order.realOrderId]).join(',')
    : '';
  useEffect(() => {
    if (!realOrderKey) {
      return undefined;
    }
    let active = true;
    Promise.all(realOrderKey.split(',').map(getLiveOrderItems))
      .then(lists => active && setItems(lists.flat()))
      .catch(() => active && setItems([]));
    return () => {
      active = false;
    };
  }, [realOrderKey]);
  return items;
}
