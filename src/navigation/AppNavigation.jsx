import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import RentalNavigation from './RentalNavigation';
import Register from '../screens/daddy/Register';
import OTPVerification from '../screens/daddy/OTPVerification';
import OnboardingScreen from '../screens/daddy/OnboardingScreen';
import SplashScreen from '../screens/user/SplashScreen';

const Stack = createStackNavigator();

const GuestAndLoginNavigation = () => (
  <Stack.Navigator
    screenOptions={{ headerShown: false }}
    initialRouteName="Splashscreen">
    <Stack.Screen name="Splashscreen" component={SplashScreen} />
    <Stack.Screen name="OnboardingScreen" component={OnboardingScreen} />
    <Stack.Screen name="Register" component={Register} />
    <Stack.Screen name="LoginScreen" component={Register} />
    <Stack.Screen name="OTPVerification" component={OTPVerification} />
    <Stack.Screen name="GuestApp" component={RentalNavigation} />
  </Stack.Navigator>
);

const AppNavigation = () => {
  const token = useSelector(state => state.Auth.token);
  return token ? <RentalNavigation /> : <GuestAndLoginNavigation />;
};

export default AppNavigation;
