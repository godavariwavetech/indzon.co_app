import { View, Text } from 'react-native'
import React from 'react'
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import BottomNavigation from '../screens/daddy/BottomNavigation';
import RestaurantScreen from '../screens/daddy/RestaurantScreen';
import CategorieItems from '../screens/daddy/CategorieItems';
import CartScreen from '../screens/daddy/CartScreen';
import AddressListScreen from '../screens/daddy/AddressListScreen';
import AddAddressScreen from '../screens/daddy/AddAddressScreen';
import MoreDetailsScreen from '../screens/daddy/MoreDetailsScreen'; 
import CheckoutScreen from '../screens/daddy/CheckoutScreen';
import SupportScreen from '../screens/daddy/SupportScreen';
import FeedbackScreen from '../screens/daddy/FeedbackScreen';
import OrderSuccessScreen from '../screens/daddy/OrderSuccessScreen';
import OrderDetailsScreen from '../screens/daddy/OrderDetailsScreen';
import CouponsScreen from '../screens/daddy/CouponsScreen';
import ServiceLocationsScreen from '../screens/daddy/ServiceLocationsScreen';
import PrivacyPolicyScreen from '../screens/daddy/PrivacyPolicyScreen';
import TermsConditionsScreen from '../screens/daddy/TermsConditionsScreen';
import SelectServiceFromLocation from '../screens/daddy/SelectServiceFromLocation';
import ServicesAvailableScreen from '../screens/daddy/ServicesAvailableScreen';
import ServiceUnavailableScreen from '../screens/daddy/ServiceUnavailableScreen';
import Register from '../screens/daddy/Register';
import OTPVerification from '../screens/daddy/OTPVerification';
import LocationSelectionScreen from '../screens/daddy/LocationSelectionScreen';
import RefundPolicyScreen from '../screens/daddy/RefundPolicyScreen';
import AboutUsScreen from '../screens/daddy/AboutUsScreen';
import CategoriesScreen from '../screens/daddy/CategoriesScreen';
import NotificationsScreen from '../screens/daddy/NotificationsScreen';
import BannerRestaurantScreen from '../screens/daddy/BannerRestaurantScreen';
import SearchShopList from '../screens/daddy/SearchShopList';
import OrderTrackingScreen from '../screens/OrderTrackingscreen';
import UserProfileScreen from '../screens/daddy/UserProfileScreen';
import UserProfileScreenLatest from '../screens/daddy/UserProfileScreenLatest';
const Stack = createStackNavigator();

export default function RentalNavigation() {
  return (
    <Stack.Navigator  screenOptions={{headerShown: false}} initialRouteName='BottomNavigation'>
    <Stack.Screen name='BottomNavigation' component={BottomNavigation} />
    <Stack.Screen name='RestaurantScreen' component={RestaurantScreen} />
    <Stack.Screen name='CategorieItems' component={CategorieItems} />
    <Stack.Screen name='CartScreen' component={CartScreen} />
    <Stack.Screen name='AddressList' component={AddressListScreen} />
    <Stack.Screen name='AddAddress' component={AddAddressScreen} />
    <Stack.Screen name='MoreDetails' component={MoreDetailsScreen} />
    <Stack.Screen name='Checkout' component={CheckoutScreen} />
    <Stack.Screen name='Support' component={SupportScreen} />
    <Stack.Screen name='Feedback' component={FeedbackScreen} />
    <Stack.Screen name='OrderSuccess' component={OrderSuccessScreen} />
    <Stack.Screen name='OrderDetails' component={OrderDetailsScreen} />
    <Stack.Screen name='Coupons' component={CouponsScreen} />
    <Stack.Screen name='ServiceLocations' component={ServiceLocationsScreen} />
    <Stack.Screen name='PrivacyPolicy' component={PrivacyPolicyScreen} />
    <Stack.Screen name='TermsConditions' component={TermsConditionsScreen} />
    <Stack.Screen name='SelectServiceFromLocation' component={SelectServiceFromLocation} />
    <Stack.Screen name='ServicesAvailable' component={ServicesAvailableScreen} />
    <Stack.Screen name='ServiceUnavailable' component={ServiceUnavailableScreen} />
    <Stack.Screen  name='Register1' component={Register} />
    <Stack.Screen  name='OTPVerification1' component={OTPVerification} />
    <Stack.Screen name='RefundPolicy' component={RefundPolicyScreen} />
    <Stack.Screen name='SearchShopList' component={SearchShopList} />
    <Stack.Screen name='OrderTracking' component={OrderTrackingScreen} />
    <Stack.Screen 
        name="AboutUs" 
        component={AboutUsScreen} 
        options={{ headerShown: false }}
      />
    <Stack.Screen
      name="LocationSelection"
      component={LocationSelectionScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="CategoriesScreen"
      component={CategoriesScreen}
      options={{
        cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
        gestureDirection: 'vertical',
      }}
    />
    <Stack.Screen 
      name="Notifications" 
      component={NotificationsScreen} 
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="BannerRestaurantScreen" 
      component={BannerRestaurantScreen} 
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="UserProfile" 
      component={UserProfileScreen} 
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="UserProfileScreenLatest" 
      component={UserProfileScreenLatest} 
      options={{ headerShown: false }}
    />
 </Stack.Navigator>
  )
}

