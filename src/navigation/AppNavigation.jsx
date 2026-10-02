// import React from 'react';
// import {createStackNavigator} from '@react-navigation/stack';
// import {useSelector} from 'react-redux';
// import RentalNavigation from './RentalNavigation';
// import Login from '../screens/daddy/LoginScreen';
// import Register from '../screens/daddy/Register';
// import OTPVerification from '../screens/daddy/OTPVerification';
// import ServiceLocationsScreen from '../screens/daddy/ServiceLocationsScreen';
// import OnboardingScreen from '../screens/daddy/OnboardingScreen';
// import ServicesAvailableScreen from '../screens/daddy/ServicesAvailableScreen';
// import ServiceUnavailableScreen from '../screens/daddy/ServiceUnavailableScreen';
// import SplashScreen from '../screens/user/SplashScreen';
// import AboutUsScreen from '../screens/daddy/AboutUsScreen';
// const Stack = createStackNavigator();

// const AuthNavigation = () => {
//   const {isLogged} = useSelector(state => state.Auth);
//   return (
//     <Stack.Navigator
//       screenOptions={{headerShown: false}}
//       initialRouteName={'Splashscreen'}>
//          <Stack.Screen name="Splashscreen" component={SplashScreen}  />
//       <Stack.Screen name="Login" component={Login} />
//       <Stack.Screen name="Register" component={Register} />
//       <Stack.Screen name="OnboardingScreen" component={OnboardingScreen} />
//       <Stack.Screen name="OTPVerification" component={OTPVerification} />
//       <Stack.Screen
//         name="ServiceLocations"
//         component={ServiceLocationsScreen}
//       />
//       <Stack.Screen
//         name="ServicesAvailable"
//         component={ServicesAvailableScreen}
//       />
//       <Stack.Screen
//         name="ServiceUnavailable"
//         component={ServiceUnavailableScreen}
//       />

//     </Stack.Navigator>
//   );
// };

// const MainNavigation = ({userRole}) => {
//   {
//     switch (userRole) {
//       case 2:
//         return <RentalNavigation />;
//       default:
//         return <></>;
//     }
//   }
// };

// const AppNavigation = () => {
//   const {token, userRole} = useSelector(state => state.Auth);
//   return token ? <MainNavigation userRole={2} /> : <AuthNavigation />;
// };

// export default AppNavigation;



import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import RentalNavigation from './RentalNavigation';
import LoginScreen from '../screens/daddy/LoginScreen';
import Register from '../screens/daddy/Register';
import OTPVerification from '../screens/daddy/OTPVerification';
import ServiceLocationsScreen from '../screens/daddy/ServiceLocationsScreen';
import OnboardingScreen from '../screens/daddy/OnboardingScreen';
import ServicesAvailableScreen from '../screens/daddy/ServicesAvailableScreen';
import ServiceUnavailableScreen from '../screens/daddy/ServiceUnavailableScreen';
import SplashScreen from '../screens/user/SplashScreen';
import AboutUsScreen from '../screens/daddy/AboutUsScreen';

// Food Trial
import SetLocationScreen from '../screens/daddy/SetLocationScreen';
import HomeScreen from '../screens/restaurants/HomeScreen';
// import CategoriesScreen from '../screens/daddy/CategoriesScreen';
import CategoriesScreen from '../screens/restaurants/CategoriesScreen';
import RestaurantsScreen from '../screens/restaurants/RestaurantsScreen';
import OnboardingScreen2 from '../screens/daddy/OnboardingScreen2';
import OnboardingScreen3 from '../screens/daddy/OnboardingScreen3';


const Stack = createStackNavigator();

const AuthNavigation = () => {
  const { isLogged } = useSelector(state => state.Auth);
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={'Splashscreen'}>
      <Stack.Screen name="Splashscreen" component={SplashScreen} />
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="Register" component={Register} />
      <Stack.Screen name="OnboardingScreen" component={OnboardingScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerification} />

      <Stack.Screen
        name="ServiceLocations"
        component={ServiceLocationsScreen}
      />
      <Stack.Screen
        name="ServicesAvailable"
        component={ServicesAvailableScreen}
      />
      <Stack.Screen
        name="ServiceUnavailable"
        component={ServiceUnavailableScreen}
      />

      {/* food trial */}
      {/* <Stack.Screen name="SetLocationScreen" component={SetLocationScreen} />
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name='CategoriesScreen' component={CategoriesScreen} />
      <Stack.Screen name='RestaurantsScreen' component={RestaurantsScreen} />

      <Stack.Screen name='OnboardingScreen2' component={OnboardingScreen2} />
      <Stack.Screen name='OnboardingScreen3' component={OnboardingScreen3} /> */}


    </Stack.Navigator>
  );
};

const MainNavigation = ({ userRole }) => {
  {
    switch (userRole) {
      case 2:
        return <RentalNavigation />;
      default:
        return <></>;
    }
  }
};

const AppNavigation = () => {
  // Restaurant menus and other public browsing features are available to guests.
  // Account and checkout flows request sign-in where it is required.
  return <RentalNavigation />;
};

export default AppNavigation;
