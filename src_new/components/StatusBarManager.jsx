import React, { useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getStatusBarConfig } from '../config/statusBarConfig';

const StatusBarManager = ({ 
  backgroundColor = 'transparent', 
  barStyle = 'dark-content', 
  translucent = true,
  animated = true,
  screenName = null
}) => {
  const navigation = useNavigation();

  // Get configuration based on screen name if provided
  const config = screenName ? getStatusBarConfig(screenName) : {
    backgroundColor,
    barStyle,
    translucent,
    animated
  };

  // Reset status bar when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(config.backgroundColor, config.animated);
        StatusBar.setTranslucent(config.translucent);
      }
      StatusBar.setBarStyle(config.barStyle, config.animated);
      
      return () => {
        // Optional: Reset to default when screen loses focus
        // This can be commented out if you want to maintain the status bar
        // StatusBar.setBackgroundColor('transparent', config.animated);
        // StatusBar.setBarStyle('dark-content', config.animated);
      };
    }, [config.backgroundColor, config.barStyle, config.translucent, config.animated])
  );

  // Set initial status bar configuration
  useEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(config.backgroundColor, config.animated);
      StatusBar.setTranslucent(config.translucent);
    }
    StatusBar.setBarStyle(config.barStyle, config.animated);
  }, [config.backgroundColor, config.barStyle, config.translucent, config.animated]);

  return null; // This component doesn't render anything
};

export default StatusBarManager; 