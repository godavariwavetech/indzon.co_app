// STATIC_APP_FLOW picks which navigator/store/persistor the app boots into
// (src_new's own screens+MainTabs vs the legacy src/ app). Keep this true —
// flipping it switches Home to ../../src/navigation/RentalNavigation (the old
// app), not src_new's MainTabs.
export const STATIC_APP_FLOW = true;

// ENABLE_LIVE_DATA controls whether src_new's own screens fetch from the real
// backend (auth, categories, shops, cart/checkout, orders, coupons, wishlist,
// addresses, profile) instead of the bundled static catalog. Independent of
// STATIC_APP_FLOW so src_new's UI/navigator/store stay exactly as they are.
export const ENABLE_LIVE_DATA = true;
