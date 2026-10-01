// Status bar configuration for different screens
export const statusBarConfig = {
  // Default configuration
  default: {
    backgroundColor: 'transparent',
    barStyle: 'dark-content',
    translucent: true,
    animated: true
  },
  
  // Auth screens
  login: {
    backgroundColor: 'transparent',
    barStyle: 'dark-content',
    translucent: true,
    animated: true
  },
  
  register: {
    backgroundColor: '#E7432D',
    barStyle: 'light-content',
    translucent: true,
    animated: true
  },
  
  otpVerification: {
    backgroundColor: '#E7432D',
    barStyle: 'light-content',
    translucent: true,
    animated: true
  },
  
  // Main app screens
  home: {
    backgroundColor: 'transparent',
    barStyle: 'dark-content',
    translucent: true,
    animated: true
  },
  
  categories: {
    backgroundColor: 'transparent',
    barStyle: 'light-content',
    translucent: true,
    animated: true
  },
  
  restaurant: {
    backgroundColor: '#E7432D',
    barStyle: 'light-content',
    translucent: true,
    animated: true
  },
  orderDetails: {
    backgroundColor: 'transparent',
    barStyle: 'light-content',
    translucent: true,
    animated: true
  },
  checkout: {
    backgroundColor: 'transparent',
    barStyle: 'light-content',
    translucent: true,
    animated: true
  },
  coupons: {
    backgroundColor: 'transparent',
    barStyle: 'light-content',
    translucent: true,
    animated: true
  },
  
  cart: {
    backgroundColor: '#E7432D',
    barStyle: 'light-content',
    translucent: true,
    animated: true
  },
  
  profile: {
    backgroundColor: 'transparent',
    barStyle: 'light-content',
    translucent: true,
    animated: true
  },
  
  // Onboarding screens
  onboarding: {
    backgroundColor: 'transparent',
    barStyle: 'dark-content',
    translucent: true,
    animated: true
  },
  
  // Support and settings screens
  support: {
    backgroundColor: '#E7432D',
    barStyle: 'light-content',
    translucent: true,
    animated: true
  },
  
  feedback: {
    backgroundColor: '#E7432D',
    barStyle: 'light-content',
    translucent: true,
    animated: true
  },
  
  address: {
    backgroundColor: '#E7432D',
    barStyle: 'light-content',
    translucent: true,
    animated: true
  }
};

// Helper function to get status bar config for a screen
export const getStatusBarConfig = (screenName) => {
  return statusBarConfig[screenName] || statusBarConfig.default;
};
