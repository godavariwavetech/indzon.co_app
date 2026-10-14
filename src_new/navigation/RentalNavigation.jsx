import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

const Stack = createStackNavigator();

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
      screenOptions={{headerShown: false, ...screenOptions}}>
      {routes.map(route => (
        <Stack.Screen key={route.name} {...route} />
      ))}
    </Stack.Navigator>
  );
}
