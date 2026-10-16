# `src_new` App Flow

This document describes how the `src_new` React Native app is wired together: bootstrap, navigation, auth, location, and commerce. It reflects the code as of commit `81142c7` ("implemented static auth flow").

## 1. The big picture: `STATIC_APP_FLOW`

Everything in `src_new` is currently gated by one flag:

```js
// src_new/config/appMode.js
export const STATIC_APP_FLOW = true;
```

With it `true` (the current state):

- There is **no backend integration**. `src_new/utils/api.js` throws immediately on any request (`'API calls are disabled while the app uses static data.'`) whenever `STATIC_APP_FLOW` is true, so every screen must use local/static data instead of the `authService`/thunk calls that hit `baseURL` (`src_new/config/config.ts`, pointing at `https://amaraa.co.in:2026/`).
- Login/OTP is a **UI-only preview**: any 4-digit code is accepted, no session token is created.
- Catalog, cart, coupons and orders come from a bundled static catalog (`src_new/config/catalog.js`, `src_new/config/coupons.js`), not from an API.
- Addresses are saved to on-device `AsyncStorage`, not a server.
- A **separate Redux store** (`staticStore` in `src_new/redux/store.ts`) and a **separate navigator** (`StaticAppNavigation` in `src_new/navigation/AppNavigation.jsx`) are used.

Flipping `STATIC_APP_FLOW` to `false` switches the app back to the "live" code paths (`LiveAppNavigation`, `store`, real `authService`/`api` calls) that are still present but currently dormant — see §3 and §4 for how each flow branches on the flag.

## 2. Bootstrap (`src_new/App.jsx`)

```
NewFlowApp
└─ GestureHandlerRootView
   └─ Provider store={STATIC_APP_FLOW ? staticStore : store}
      └─ SafeAreaProvider
         └─ PersistGate persistor={STATIC_APP_FLOW ? staticPersistor : persistorStore}
            ├─ (not yet bootstrapped/splash not finished) → SplashScreen
            └─ (ready) → NavigationContainer → AppNavigation
```

- `SplashScreen` shows a native splash (`react-native-splash-screen`) until its logo animation reports ready (`onLogoReady`), then a 1.6s timer flips `splashFinished`.
- The JS screen only swaps in once both `splashFinished` is true **and** `redux-persist`'s `PersistGate` has rehydrated whichever store is active.
- Which Redux store and which persistor get used is decided once, by `STATIC_APP_FLOW`, at the `Provider`/`PersistGate` level.

## 3. Navigation (`src_new/navigation/`)

`AppNavigation.jsx` is the root switch:

```js
export default function AppNavigation(props) {
  if (STATIC_APP_FLOW) return <StaticAppNavigation />;
  return <LiveAppNavigation {...props} />;
}
```

### 3.1 Static flow (current, active path)

`StaticAppNavigation` reads `state.Auth.previewLoginComplete` (set once OTP is "verified") and `state.Auth.deliveryAddress`:

- Not remembered → stack = `defaultGuestRoutes` (`Login`, `OtpVerification`, `TermsConditions`, `PrivacyPolicy`), starting at `Login`.
- Remembered, no delivery address → stack = `staticRoutes`, starting at `LocationSetup`.
- Remembered, has delivery address → stack = `staticRoutes`, starting at `Home`.

`staticRoutes` is the full post-login stack:
`TermsConditions`, `PrivacyPolicy`, `LocationSetup`, `AddAddress`, `AddressList`, `Home` (→ `MainTabs`), `ProductList`, `Search`, `CategoryDetails`, `ProductDetails`, `ShopDetails`, `Cart`, `Coupons`, `Wishlist`, `OrderDetails`, `OrderConfirmation`, `MyAccount`, `HelpSupport`, `AboutUs`.

The `key={...}` on `RentalNavigation` forces a full navigator remount whenever the guest/signed-in state changes, so there's no stale screen state left over from the previous stack.

`RentalNavigation` (`src_new/navigation/RentalNavigation.jsx`) is a thin wrapper around `createNativeStackNavigator` — it just turns a `routes` array into `Stack.Screen`s with `headerShown: false` and slide-from-right transitions.

`Home` resolves to `MainTabs` (`src_new/navigation/MainTabs.jsx`), a custom-tab-bar bottom tab navigator with 4 tabs:

| Tab | Screen |
|---|---|
| HomeTab | `StaticHomeScreen` → `screens/main/HomeContent.jsx` |
| CategoriesTab | `CategoriesBrowseScreen` (from `CommerceScreens.jsx`) |
| OrdersTab | `MainOrdersScreen` |
| ProfileTab | `MainProfileScreen` |

The tab bar hides itself while the keyboard is visible and uses a spring animation on the active icon.

### 3.2 Live flow (dormant, kept for later backend integration)

`LiveAppNavigation` reads `state.Auth.isLogged || state.Auth.token` and `state.Auth.deliveryAddress` to pick between `defaultGuestRoutes` (adds onboarding, currently commented out) and `defaultAuthenticatedRoutes` (`LocationSetup`, `AddAddress`, `Home` → `HomeNavigation`, which is actually `src/navigation/RentalNavigation` from the **old** `src/` tree, not `src_new`). This path is not reachable while `STATIC_APP_FLOW` is `true`.

### 3.3 Other navigation files

- `UserNavigation.jsx` — re-exports `RentalNavigation` under a legacy name.
- `TabNaviagator.jsx` (typo kept from original) — generic bottom-tab wrapper, used by `FreelancerTabNavigator`.
- `FreelancerNavigation.jsx` / `FreelancerTabNavigator.jsx` — thin re-exports of `RentalNavigation` / `TabNaviagator`; no freelancer-specific screens are registered in `src_new`, so these appear to be unused scaffolding carried over from another app variant.
- `StatusBarListener.jsx` — sets a transparent/translucent Android status bar and dark content on mount; not wired into `AppNavigation` directly (each screen also sets its own `<StatusBar>`).

## 4. Auth flow (login → OTP → home)

Screens: `src_new/screens/auth/LoginScreen.jsx` → `OtpVerificationScreen.jsx`. (`AuthenticatedScreen.jsx` is a leftover "signed in" placeholder screen exported from `screens/index.js` but not referenced by either navigator — dead code in the current wiring.)

### 4.1 Login (`LoginScreen.jsx`)

1. User enters a 10-digit mobile number (validated with `isValidPhoneNumber`, `src_new/utils/phone.ts`, pattern `/^[6-9]\d{9}$/`).
2. On submit:
   - If `STATIC_APP_FLOW` → skips the network call and fabricates `{resendAfterSeconds: DEFAULT_RESEND_SECONDS}` (60s, `src_new/config/authFlow.js`).
   - Else → calls `authService.requestOtp(phoneNumber)` (`src_new/services/authService.js`), which POSTs to `endpoints.REQUEST_OTP` (`public_app/getuserloginotp`).
3. Navigates to `OtpVerification` with `{phoneNumber, resendAfterSeconds}`.

### 4.2 OTP verification (`OtpVerificationScreen.jsx`)

1. 4-digit code entry (`OTP_LENGTH = 4`), with a resend countdown via `useCountdown` (`src_new/hooks/useCountdown.ts`).
2. On submit:
   - **Static path**: any 4 digits pass. Dispatches `rememberStaticLogin(phoneNumber)` (`src_new/redux/reducers/auth.js`), which sets `previewLoginComplete: true` and `mobileNumber`, then flushes `staticPersistor` so the choice survives app restarts. No token/customerId is created — this is a local "remember this device skipped login" flag, not a real session.
   - **Live path**: calls `authService.verifyOtp(phoneNumber, otp)` → POSTs to `endpoints.VERIFY_CUSTOMER_OTP` (`public_app/customerlogin`), then dispatches `completeAuthentication(session)` with the resulting `{token, customerId, mobileNumber}`.
3. Once `previewLoginComplete` (static) or `isLogged`/`token` (live) changes, `AppNavigation` remounts the stack into the authenticated set (see §3.1/§3.2) and routes to `LocationSetup` or `Home` depending on whether a delivery address is already stored.

### 4.3 Auth Redux slice (`src_new/redux/reducers/auth.js`)

State includes both the "real" auth fields (`token`, `isLogged`, `customerId`, `profileData`, ...) and the static-preview field `previewLoginComplete`, plus shared delivery-location fields (`location`, `locationName`, `locationId`, `deliveryAddress`) used by both flows. Thunks present (`verifyMobile`, `addCustomer`, `loginAction`, `verifyCustomerMobile`, `verifyCustomerOTP`, `deleteAccount`, `updateCustomerProfile`, `getCustomerProfile`) all hit `api`/`endpoints` and are therefore no-ops while `STATIC_APP_FLOW` is true (the `api` interceptor throws before any request is sent). `actionLogout` resets to `initialState`; `setDeliveryAddress` also derives `location`/`locationName`/`locationId` from the address it's given.

### 4.4 Sign out

`MainProfileScreen` dispatches `actionLogout()` (clears `Auth` slice) plus `resetCommerce()` and `clearSelectedAddress()`, which drops the user back to the guest stack (`Login`) on the next `StaticAppNavigation` render.

## 5. Location & address flow

1. **`LocationSetupScreen`** (shown first time after login, or whenever there's no `deliveryAddress`): "Use my current location" calls `locationService.getCurrentLocation()` (device GPS via `react-native-geolocation-service`, after a `react-native-permissions` check) and navigates to `AddAddress` with the coordinates; "Enter address manually" navigates to `AddAddress` with no coordinates.
2. **`AddAddressScreen`**: shows a `FreeMap` (OpenStreetMap tiles, see §5.1) centered on the chosen/derived coordinates, reverse-geocodes the pin position, and lets the user search for a place or drag the pin. Selecting a place or confirming the pin opens `AddressDetailsSheet` to collect name/phone/door no./pincode/label, validated by `validateAddress` (`src_new/services/locationService.js`). Saving:
   - Writes the address into on-device storage via `locationService.saveAddress` (`AsyncStorage`, keyed `amaraa-{static|local}-addresses:{customerId|guest}`).
   - Dispatches `setDeliveryAddress` (auth slice), `updateUserAddress` (`daddy` reducer — legacy "dashboard" state carried over from the old app), and `setSelectedAddress` (`addressSlice`).
   - Flushes the active persistor, then either resets navigation to `Home` (first-time onboarding) or goes back (editing from the address list/cart).
3. **`AddressListScreen`**: lists saved addresses from `locationService.getSavedAddresses`, lets the user pick one as the active delivery address (same three dispatches as above), edit (long-press → `AddAddress` with `{address}`), or delete (with a `ConfirmDialog`).

### 5.1 Map/geocoding provider (`FreeMap`, `locationService.js`, `config/freeMaps.js`)

- Tiles: `tile.openstreetmap.org` (no API key).
- Search/autocomplete + reverse geocoding: Nominatim (`nominatim.openstreetmap.org`) with a Photon-shaped fallback (`photon.komoot.io`), rate-limited to ~1 request/second and cached for 24h in-memory (`lookupCache` in `locationService.js`). `config/googleMaps.js` defines `GOOGLE_MAPS_API_KEY` from an env var but it is **not used** anywhere in `src_new` — Google Maps is not currently wired up; the app uses the free OSM-based stack exclusively.

## 6. Main / commerce flow

Everything here reads from a **bundled static catalog** — `src_new/config/catalog.js` (`categories`, `products`, `shops`, `sampleOrders`, artwork) — not from any backend. `src_new/config/coupons.js` holds a fixed coupon list and `evaluateCoupon(code, items, orders)` discount logic (percent/flat/cap/min-items/first-order/category rules).

- **Home** (`HomeTab` → `screens/main/HomeContent.jsx`, re-exported as `StaticHomeScreen`): landing content, offer carousel (`components/main/OfferCarousel.jsx`), category shortcuts.
- **Categories** (`CategoriesTab` → `MainCategoriesScreen.jsx`, and `ProductListScreen`/`CategoryDetails` in `CommerceScreens.jsx`): category/subcategory browsing with search, filter (`all` / `under500` / `toprated`) and sort (price/rating/discount), backed by `matchesFilter` and in-memory filtering of `products`/`shops`.
- **Product details** (`screens/main/ProductDetailsScreen.jsx`): single product view; add-to-cart/wishlist dispatch into the `commerce` slice.
- **Cart** (`CartScreen` in `CommerceScreens.jsx`): groups cart items by category, computes amount/original/discount/total (applying `evaluateCoupon` if a coupon code is set), shows delivery address + contact (from the `Auth` slice), lets the user add more items, and on "Place order" builds a fully-formed local order object (with one "shipment" group per category) and dispatches `placePreviewOrder`, then navigates to `OrderConfirmation`. If no delivery address is set yet, checkout instead redirects to `AddressList`.
- **Coupons** (`screens/main/CouponsScreen.jsx`): lets the user browse/apply a coupon code, dispatching `setCouponCode` (`commerce` slice).
- **Order confirmation/details** (`OrderConfirmationScreen`, `OrderDetailsScreen`): confirmation auto-navigates to details after 1.5s; details screen merges locally-placed orders (`state.commerce.orders`) with `sampleOrders` seed data, shows per-category "shipments" (`components/main/OrderShipment.jsx`), and lets the user rate/leave feedback (`saveOrderFeedback`).
- **Search** (`screens/main/SearchScreen.jsx`): recent-search history persisted to `AsyncStorage` (`amaraa.search.recent.v1`), category shortcuts, searches the static `products` list.
- **Wishlist** (`WishlistScreen` in `CommerceScreens.jsx`): products whose id is in `state.commerce.wishlist`.
- **Orders tab** (`MainOrdersScreen.jsx`): the user's order history (same merge of local + sample orders).
- **Profile** (`MainProfileScreen.jsx`): menu to `MyAccount`, `Wishlist`, `AddressList`, `Settings` (modal), `HelpSupport`, `AboutUs`; sign-out and delete-account actions.
- **Related/static pages** (`RelatedScreens.jsx`): `AboutUsScreen`, `HelpSupportScreen`, `MyAccountScreen`, `ShopDetailsScreen`.

### 6.1 `commerce` Redux slice (`src_new/redux/reducers/commerce.js`)

Pure client-side cart/wishlist/orders/feedback state: `cart` (productId → quantity), `couponCode`, `wishlist`, `profileName/Email`, `messages` (support), `orders` (locally placed), `feedback` (per-order rating/text). All reducers are synchronous — no thunks, no API calls. This is the slice actually driving the UI in static mode (persisted under the `Dashboard`/`commerce` keys — see §7).

### 6.2 Legacy "live" commerce reducers

`src_new/redux/reducers/daddy.js` (aliased `Dashboard` in the store), `search.js`, `userDashboard.js`, and `reviews.js` are large `createAsyncThunk`-based reducers that call the real backend (`endpoints.DADDY_GET_CATEGORIES`, `GET_SHOPS`, `GLOBAL_SEARCH`, `GET_SEARCH_SHOP_LIST`, `TOUR_PACKAGES`/`GET_RENTAL_ITEMS` (unrelated rental/tour-booking leftovers), `CANCEL_ORDER`, `GIVE_ORDER_RATING`, etc.). They're wired into the store and a couple of their sync action creators are still dispatched from the static screens (e.g. `updateUserAddress` from `daddy.js`), but their thunks are unused/no-ops under `STATIC_APP_FLOW`. Treat these as the "real backend" counterpart to the `commerce` slice, pending backend integration.

## 7. Redux store (`src_new/redux/store.ts`)

Two independent `configureStore` instances exist, each with its own `redux-persist` setup:

| | `store` (live) | `staticStore` (active while `STATIC_APP_FLOW`) |
|---|---|---|
| Reducers | `Auth` (persisted, key `amaraa-new-auth`), `userDahboard`, `Dashboard` (persisted, key `amaraa-new-dashboardCart`, whitelists cart/catalog fields), `coupons`, `address`, `search` | `commerce`, `Auth` (persisted, key `amaraa-static-login`, whitelists only `previewLoginComplete`/`mobileNumber`/`deliveryAddress`/`location`/`locationName`/`locationId`), `Dashboard`, `address` |
| Persistor | `persistorStore` | `staticPersistor` |

Screens explicitly pick `STATIC_APP_FLOW ? staticPersistor : persistorStore` whenever they need to flush persisted state immediately (e.g. after saving a delivery address, or completing OTP) so navigation that depends on persisted state (`previewLoginComplete`, `deliveryAddress`) doesn't race the write.

Note the static store's `Auth` persistence intentionally excludes `token`/`isLogged`/`customerId` — real backend credentials are never written to disk in static mode.

## 8. Services & utils

- **`services/authService.js`** — `requestOtp`/`verifyOtp` against the live backend; validates phone/OTP shape and unwraps `{success, status, data}` response envelopes. Not used while static.
- **`services/locationService.js`** — device location, OSM-based reverse geocoding/search/place lookup, local address CRUD via `AsyncStorage` (see §5).
- **`services/mapTiles.js`** — helper(s) for the `FreeMap` tile layer (covered by `__tests__/mapTiles.test.js`).
- **`services/NotificationsService.js`** / **`services/userService.js`** — present but not traced in this pass; check them directly if you need push-notification or user-profile-API specifics.
- **`utils/api.js`** — shared `axios` instance; injects `Authorization: Bearer <token>` from the live `store`, and short-circuits every request while `STATIC_APP_FLOW` is true.
- **`utils/networkCall.ts`** — likely a typed wrapper/alternative to `api.js` (not traced in depth).
- **`utils/phone.ts`** — phone/OTP sanitization, validation, masking (used across auth screens).
- **`utils/mapGeometry.js`** — map math (sprite/tile calculations) backing `FreeMap`/`ReferenceArtwork` sprite atlases.
- **`utils/orderPricing.js`** / **`utils/orderResponse.js`** — order total/shipment-status helpers used by `OrderShipment.jsx` and the `daddy` reducer.
- **`utils/requestPermissions.ts`** — permission-request helpers (location, etc.).
- **`utils/responsiveScale.ts`** — design-frame-to-device scaling, used by the login/auth screens' pixel-perfect layouts (`config/login.ts`).
- **`utils/utils.ts`** — generic helpers (not traced in depth).

## 9. Config

- **`config/appMode.js`** — the `STATIC_APP_FLOW` master switch (§1).
- **`config/config.ts`** — `baseURL` + the full `endpoints` map for the live backend.
- **`config/authFlow.js`** — OTP length/resend seconds, auth screen color palette, onboarding slide content.
- **`config/login.ts`** — pixel-accurate design-frame constants for the login screen layout.
- **`config/catalog.js`** — the entire static product/category/shop catalog and bundled artwork used by the commerce screens.
- **`config/coupons.js`** — static coupon list + discount evaluation logic.
- **`config/staticData.js`** — an older/alternate sample category list (`sampleCategories`); check usages before relying on it, since `catalog.js` is what the live commerce screens actually import.
- **`config/freeMaps.js`** — OSM tile/geocoder URLs, user agent, zoom limits.
- **`config/googleMaps.js`** — unused `GOOGLE_MAPS_API_KEY` placeholder.
- **`config/statusBarConfig.js`** — status bar presets consumed by `components/withStatusBar.jsx`/`StatusBarManager.jsx`.
- **`config/theme.ts`** — shared theme tokens.
- **`config/i18n.ts`** + **`config/locales/{en,fr,hi}.ts`** — i18n setup and translation tables; verify which screens actually consume `i18n.ts` before assuming full localization coverage, since most screens above hard-code English strings directly.

## 10. Reusable components (`src_new/components/`)

- **Auth** (`components/auth/`): `AuthScreenLayout`, `AuthButton`, `ShoppingLoginLayout`, `BrandLogo`, `LoginBackground`, `SigninCardHeader` — the login/OTP visual shell.
- **Location** (`components/location/`): `FreeMap` (OSM tile renderer + gestures, see `__tests__/freeMapGestures.test.jsx`), `DeliveryMapMarker`, `LocationButton`, `AddressDetailsSheet`.
- **Main/commerce** (`components/main/`): `MainUi` (shared colors/layout primitives: `Page`, `Heading`, `Footer`, `SearchField`, `EmptyState`, `usePageReady`), `ProductCard`, `CartPill`, `OrderShipment`, `OfferCarousel`, `SettingsModal`, `ConfirmDialog`, `Skeleton` (loading placeholders), `SuccessCelebration`, `ReferenceArtwork` (sprite-atlas image renderer), `TabIcon`.
- **Generic**: `CustomAlert`, `CustomModal`, `Header`, `Typography`/`ReadableText` (text/input wrappers used almost everywhere above), `loader`, `StatusBarManager`/`withStatusBar`, `SortButtons`, `StarRating`.

## 11. Test coverage (`src_new/__tests__/`)

Signals which flows are considered important enough to have regression tests: `authFlow.test.js`, `authScreens.test.jsx` (auth/OTP); `locationService.test.js`, `locationScreens.test.jsx`, `locationNavigation.test.jsx`, `freeMaps.test.js`, `freeMapGestures.test.jsx`, `mapTiles.test.js` (location/map stack); `coupons.test.js` (discount logic); `offerCarousel.test.jsx`, `searchScreen.test.jsx`, `settingsModal.test.jsx` (commerce UI). There is no dedicated cart/checkout/order test file.

## 12. Known loose ends / things to revisit

- `AuthenticatedScreen.jsx` is exported from `screens/index.js` but not referenced by either navigator — likely dead code.
- `FreelancerNavigation.jsx`/`FreelancerTabNavigator.jsx` have no corresponding screens registered anywhere in `src_new` — appear to be unused scaffolding.
- `config/staticData.js` (`sampleCategories`) looks superseded by `config/catalog.js` — confirm nothing still depends on it before deleting.
- `config/googleMaps.js` is dead code; the app uses free OSM tiles/geocoding exclusively (`config/freeMaps.js`).
- Several `redux/reducers/*.js` files (`daddy.js`, `search.js`, `userDashboard.js`, `reviews.js`, `coupons.js`) contain full backend-thunk implementations that are currently unreachable because `utils/api.js` blocks all requests under `STATIC_APP_FLOW`; they're the intended target when backend integration resumes (flip `STATIC_APP_FLOW` to `false` and wire `LiveAppNavigation`/`store` back in).
