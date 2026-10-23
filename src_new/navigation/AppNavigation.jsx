import React from 'react';
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
  ProductDetailsScreen,
  ProductListScreen,
  WishlistScreen,
} from '../screens/main/CommerceScreens';
import SearchScreen from '../screens/main/SearchScreen';
import CouponsScreen from '../screens/main/CouponsScreen';
import {ENABLE_LIVE_DATA, STATIC_APP_FLOW} from '../config/appMode';
// Onboarding is temporarily disabled.
// import OnboardingScreen from '../screens/onboarding/OnboardingScreen';

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
  const hasDeliveryAddress = useSelector(state =>
    Boolean(state.Auth.deliveryAddress),
  );
  const needsName = useSelector(state =>
    Boolean(ENABLE_LIVE_DATA && state.Auth.customerId && !state.Auth.customerName),
  );
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
