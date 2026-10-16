import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

export default function RentalNavigation({
  routes = [],
  initialRouteName,
  screenOptions,
}) {
  if (routes.length === 0) {
    return null;
  }
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName || routes[0].name}
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        animation: 'slide_from_right',
        ...screenOptions,
      }}>
      {routes.map(route => (
        <Stack.Screen key={route.name} {...route} />
      ))}
    </Stack.Navigator>
  );
}
