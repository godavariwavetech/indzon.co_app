import React from 'react';
import {useSelector} from 'react-redux';
import RentalNavigation from './RentalNavigation';
import TermsConditionsScreen from '../../src/screens/daddy/TermsConditionsScreen';
import PrivacyPolicyScreen from '../../src/screens/daddy/PrivacyPolicyScreen';
import HomeNavigation from '../../src/navigation/RentalNavigation';
import LocationSetupScreen from '../screens/location/LocationSetupScreen';
import AddAddressScreen from '../screens/location/AddAddressScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import OtpVerificationScreen from '../screens/auth/OtpVerificationScreen';
import AddressListScreen from '../screens/location/AddressListScreen';
import StaticHomeScreen from '../screens/home/StaticHomeScreen';
import {STATIC_APP_FLOW} from '../config/appMode';
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
  ...defaultGuestRoutes,
  {name: 'LocationSetup', component: LocationSetupScreen},
  {name: 'AddAddress', component: AddAddressScreen},
  {name: 'AddressList', component: AddressListScreen},
  {name: 'Home', component: StaticHomeScreen},
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
    return <RentalNavigation routes={staticRoutes} initialRouteName="Login" />;
  }
  return <LiveAppNavigation {...props} />;
}
