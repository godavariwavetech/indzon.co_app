import notifee, { AndroidImportance, AndroidStyle } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import {Platform} from 'react-native';

export const setupNotificationHandlers = (navigation) => {
  // Foreground notifications

  messaging().onMessage(async remoteMessage => {
   
    displayNotification(remoteMessage.notification);
  });

  // Background/Quit state notifications
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    displayNotification(remoteMessage.notification);
  });

  // Notification opened handler
  messaging().onNotificationOpenedApp(remoteMessage => {
    handleNotificationNavigation(remoteMessage.data, navigation);
  });

  // Check if app was opened from notification
  messaging().getInitialNotification().then(remoteMessage => {
    if (remoteMessage) {
      handleNotificationNavigation(remoteMessage.data, navigation);
    }
  });
};

const displayNotification = async (notification) => {
  try {
    await notifee.displayNotification({
      title: notification.title,
      body: notification.body,
      android: {
        channelId: 'default4',
        important:true,
        importance:AndroidImportance.HIGH,
        color: '#065E2C', 
        colorized: true,  
        style: {
          type: AndroidStyle.BIGTEXT,
          text: notification.body,
        },
        // Add custom text appearance
        pressAction: {
          id: 'default',
          launchActivity: 'default',
        },
      },
      ios: {
        foregroundPresentationOptions: {
          badge: true,
          sound: true,
          banner: true,
          list: true,
        },
      },
    });
  } catch (error) {
    console.error('Error displaying notification:', error);
  }
};

const handleNotificationNavigation = (data, navigation) => {
  if (data.type === 'order_update') {
    navigation.navigate('OrderDetails', { orderId: data.orderId });
  }
  // Add more navigation handlers as needed
};

// export const getFCMToken = async () => {
//   try {
//     return await messaging().getToken();
//   } catch (error) {
//     console.error('Error getting FCM token:', error);
//     return null;
//   }
// }; 

export const getFCMToken = async () => {
  try {
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      if (!enabled) {
        console.warn('Notification permission was not granted.');
        return null;
      }
      if (!messaging().isDeviceRegisteredForRemoteMessages) {
        await messaging().registerDeviceForRemoteMessages();
      }
    }

    const token = await messaging().getToken();

    messaging().onMessage(async remoteMessage => {
      try {
        await notifee.createChannel({
          id: 'default1',
          name: 'Default Channel',
          importance: AndroidImportance.HIGH,
          sound: 'default',
          vibration: true,
        });

        await notifee.displayNotification({
          title: remoteMessage.notification?.title,
          body: remoteMessage.notification?.body,
          android: {
            channelId: 'default1',
            importance: AndroidImportance.HIGH,
          },
        });
      } catch (error) {
        console.warn('Unable to display foreground notification:', error);
      }
    });

    return token;
  } catch (error) {
    console.warn('FCM is unavailable; continuing without a notification token:', error);
    return null;
  }
};
