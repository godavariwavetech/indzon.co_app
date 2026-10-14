import React from 'react';
import { StatusBar, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

const withStatusBar = (WrappedComponent, statusBarConfig = {}) => {
  const {
    backgroundColor = 'transparent',
    barStyle = 'dark-content',
    translucent = true,
    animated = true
  } = statusBarConfig;

  return (props) => {
    // Reset status bar when screen comes into focus
    useFocusEffect(
      React.useCallback(() => {
        if (Platform.OS === 'android') {
          StatusBar.setBackgroundColor(backgroundColor, animated);
          StatusBar.setTranslucent(translucent);
        }
        StatusBar.setBarStyle(barStyle, animated);
        
        return () => {
          // Cleanup when screen loses focus (optional)
          // Uncomment if you want to reset status bar when leaving screen
          // StatusBar.setBackgroundColor('transparent', animated);
          // StatusBar.setBarStyle('dark-content', animated);
        };
      }, [backgroundColor, barStyle, translucent, animated])
    );

    return <WrappedComponent {...props} />;
  };
};

export default withStatusBar; 