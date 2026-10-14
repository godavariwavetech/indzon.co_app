import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import commonStyles from '../commonstyles/CommonStyles';

const Tab = createBottomTabNavigator();

export default function TabNavigator({
  routes = [],
  initialRouteName,
  screenOptions,
}) {
  if (routes.length === 0) {
    return null;
  }
  return (
    <Tab.Navigator
      initialRouteName={initialRouteName || routes[0].name}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: commonStyles.appMainColor,
        tabBarInactiveTintColor: '#64748B',
        ...screenOptions,
      }}>
      {routes.map(route => (
        <Tab.Screen key={route.name} {...route} />
      ))}
    </Tab.Navigator>
  );
}
