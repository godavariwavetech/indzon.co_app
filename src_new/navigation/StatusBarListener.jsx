import React, { useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';

const StatusBarListener = () => {
  useEffect(() => {
    // Set default status bar configuration on app start
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('transparent', true);
      StatusBar.setTranslucent(true);
    }
    StatusBar.setBarStyle('dark-content', true);
  }, []);

  return null;
};

export default StatusBarListener; 