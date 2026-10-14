import { StatusBar, Platform } from 'react-native';

/**
 * Utility functions for managing status bar across the app
 */

/**
 * Set status bar configuration for a specific screen
 * @param {Object} config - Status bar configuration
 * @param {string} config.backgroundColor - Background color
 * @param {string} config.barStyle - Bar style ('light-content' or 'dark-content')
 * @param {boolean} config.translucent - Whether status bar is translucent
 * @param {boolean} config.animated - Whether to animate the change
 */
export const setStatusBarConfig = (config) => {
  const {
    backgroundColor = 'transparent',
    barStyle = 'dark-content',
    translucent = true,
    animated = true
  } = config;

  if (Platform.OS === 'android') {
    StatusBar.setBackgroundColor(backgroundColor, animated);
    StatusBar.setTranslucent(translucent);
  }
  StatusBar.setBarStyle(barStyle, animated);
};

/**
 * Reset status bar to default configuration
 */
export const resetStatusBar = () => {
  setStatusBarConfig({
    backgroundColor: 'transparent',
    barStyle: 'dark-content',
    translucent: true,
    animated: true
  });
};

/**
 * Common status bar configurations for different screen types
 */
export const statusBarPresets = {
  transparent: {
    backgroundColor: 'transparent',
    barStyle: 'dark-content',
    translucent: true,
    animated: true
  },
  light: {
    backgroundColor: 'transparent',
    barStyle: 'light-content',
    translucent: true,
    animated: true
  },
  colored: {
    backgroundColor: '#FE4A31',
    barStyle: 'light-content',
    translucent: true,
    animated: true
  },
  dark: {
    backgroundColor: '#065E2C',
    barStyle: 'light-content',
    translucent: true,
    animated: true
  }
};

/**
 * Quick setter functions for common configurations
 */
export const setTransparentStatusBar = () => setStatusBarConfig(statusBarPresets.transparent);
export const setLightStatusBar = () => setStatusBarConfig(statusBarPresets.light);
export const setColoredStatusBar = () => setStatusBarConfig(statusBarPresets.colored);
export const setDarkStatusBar = () => setStatusBarConfig(statusBarPresets.dark); 