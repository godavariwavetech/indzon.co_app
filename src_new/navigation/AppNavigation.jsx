import React, {useEffect} from 'react';
import {Alert, Platform} from 'react-native';
import {useSelector} from 'react-redux';
import RentalNavigation from './RentalNavigation';
import TermsConditionsScreen from '../../src/screens/daddy/TermsConditionsScreen';
import PrivacyPolicyScreen from '../../src/screens/daddy/PrivacyPolicyScreen';
import HomeNavigation from '../../src/navigation/RentalNavigation';
import LocationSetupScreen from '../screens/location/LocationSetupScreen';
import NamePromptScreen from '../screens/auth/NamePromptScreen';
import AddAddressScreen from '../screens/location/AddAddressScreen';
import ServiceAreasScreen from '../screens/location/ServiceAreasScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import OtpVerificationScreen from '../screens/auth/OtpVerificationScreen';
import AddressListScreen from '../screens/location/AddressListScreen';
import MainTabs from './MainTabs';
import {
  AboutUsScreen,
  HelpSupportScreen,
  MyAccountScreen,
  ShopDetailsScreen,
} from '../screens/main/RelatedScreens';
import {
  CartScreen,
  OrderConfirmationScreen,
  OrderDetailsScreen,
  PaymentScreen,
  ProductDetailsScreen,
  ProductListScreen,
  WishlistScreen,
} from '../screens/main/CommerceScreens';
import SearchScreen from '../screens/main/SearchScreen';
import CouponsScreen from '../screens/main/CouponsScreen';
import {ENABLE_LIVE_DATA, STATIC_APP_FLOW} from '../config/appMode';
import {getFCMToken} from '../services/NotificationsService';
import userService from '../services/userService';
// Onboarding is temporarily disabled.
// import OnboardingScreen from '../screens/onboarding/OnboardingScreen';

// TEMPORARY DIAGNOSTIC: on iOS, console.log/error is invisible on a TestFlight
// build (no Mac/Xcode attached), so there is no other way to see why push
// registration failed. Surface it on-screen once per app launch. Remove once
// FCM/notifications are confirmed working in production.
let fcmDiagnosticShown = false;
function notifyFcmDiagnostic(message) {
  if (Platform.OS !== 'ios' || fcmDiagnosticShown) {
    return;
  }
  fcmDiagnosticShown = true;
  Alert.alert('Push notification setup (debug)', message);
}

const defaultGuestRoutes = [
  // {name: 'Onboarding', component: OnboardingScreen},
  {name: 'Login', component: LoginScreen},
  {name: 'OtpVerification', component: OtpVerificationScreen},
  {name: 'TermsConditions', component: TermsConditionsScreen},
  {name: 'PrivacyPolicy', component: PrivacyPolicyScreen},
];
const defaultAuthenticatedRoutes = [
  {name: 'LocationSetup', component: LocationSetupScreen},
  {name: 'AddAddress', component: AddAddressScreen},
  {name: 'Home', component: HomeNavigation},
];

const staticRoutes = [
  {name: 'TermsConditions', component: TermsConditionsScreen},
  {name: 'PrivacyPolicy', component: PrivacyPolicyScreen},
  {name: 'LocationSetup', component: LocationSetupScreen},
  {name: 'NamePrompt', component: NamePromptScreen},
  {name: 'ServiceAreas', component: ServiceAreasScreen},
  {name: 'AddAddress', component: AddAddressScreen},
  {name: 'AddressList', component: AddressListScreen},
  {name: 'Home', component: MainTabs},
  {name: 'ProductList', component: ProductListScreen},
  {name: 'Search', component: SearchScreen},
  {name: 'CategoryDetails', component: ProductListScreen},
  {name: 'ProductDetails', component: ProductDetailsScreen},
  {name: 'ShopDetails', component: ShopDetailsScreen},
  {name: 'Cart', component: CartScreen},
  {name: 'Payment', component: PaymentScreen},
  {name: 'Coupons', component: CouponsScreen},
  {name: 'Wishlist', component: WishlistScreen},
  {name: 'OrderDetails', component: OrderDetailsScreen},
  {name: 'OrderConfirmation', component: OrderConfirmationScreen},
  {name: 'MyAccount', component: MyAccountScreen},
  {name: 'HelpSupport', component: HelpSupportScreen},
  {name: 'AboutUs', component: AboutUsScreen},
];

// Retain the live flow for when backend integration is enabled again.
export function LiveAppNavigation({
  guestRoutes = defaultGuestRoutes,
  authenticatedRoutes = defaultAuthenticatedRoutes,
  guestInitialRouteName,
  authenticatedInitialRouteName,
}) {
  const signedIn = useSelector(state =>
    Boolean(state.Auth.isLogged || state.Auth.token),
  );
  const hasDeliveryAddress = useSelector(state =>
    Boolean(state.Auth.deliveryAddress),
  );
  return (
    <RentalNavigation
      key={signedIn ? 'authenticated' : 'guest'}
      routes={signedIn ? authenticatedRoutes : guestRoutes}
      initialRouteName={
        signedIn
          ? authenticatedInitialRouteName ||
            (authenticatedRoutes === defaultAuthenticatedRoutes
              ? hasDeliveryAddress
                ? 'Home'
                : 'LocationSetup'
              : undefined)
          : guestInitialRouteName ||
            (guestRoutes === defaultGuestRoutes ? 'Login' : undefined)
      }
    />
  );
}

export default function AppNavigation(props) {
  if (STATIC_APP_FLOW) {
    return <StaticAppNavigation />;
  }
  return <LiveAppNavigation {...props} />;
}

function StaticAppNavigation() {
  const remembered = useSelector(
    state => state.Auth.previewLoginComplete === true,
  );
  const customerId = useSelector(state => state.Auth.customerId);
  const locationId = useSelector(state => state.Auth.locationId);
  const hasDeliveryAddress = useSelector(state =>
    Boolean(state.Auth.deliveryAddress),
  );
  const needsName = useSelector(state =>
    Boolean(ENABLE_LIVE_DATA && state.Auth.customerId && !state.Auth.customerName),
  );
  useEffect(() => {
    if (!ENABLE_LIVE_DATA || !customerId) {
      return;
    }
    let active = true;
    getFCMToken()
      .then(async token => {
        console.log('[FCM] customerId:', customerId, 'locationId:', locationId, 'player_id (token):', token);
        if (!active) {
          return;
        }
        if (!token) {
          // console.log/warn/error are invisible on a TestFlight build with no
          // Mac/Xcode attached - surface this on-screen once per launch so a
          // tester can actually report what's failing instead of guessing.
          notifyFcmDiagnostic(
            'No push token was returned (permission likely not granted, or ' +
              'Apple\'s APNs token never arrived in time). Notifications will ' +
              'not work until this is resolved.',
          );
          return;
        }
        try {
          const response = await userService.registerFcmToken(customerId, token, locationId);
          console.log('[FCM] postplayer_id response:', response);
        } catch (error) {
          console.error('[FCM] Failed to register player_id with backend:', error);
          notifyFcmDiagnostic(`Got a push token but failed to register it with the backend: ${error?.message || error}`);
        }
      })
      .catch(error => {
        console.error('[FCM] Could not retrieve device token:', error);
        notifyFcmDiagnostic(`Could not retrieve device token: ${error?.message || error}`);
      });
    return () => {
      active = false;
    };
  }, [customerId, locationId]);
  const setupRoute = needsName ? 'NamePrompt' : 'LocationSetup';
  return (
    <RentalNavigation
      key={remembered ? 'static-signed-in' : 'static-guest'}
      routes={remembered ? staticRoutes : defaultGuestRoutes}
      initialRouteName={
        remembered ? (hasDeliveryAddress ? 'Home' : setupRoute) : 'Login'
      }
    />
  );
}
