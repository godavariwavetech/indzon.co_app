import React, {useEffect} from 'react';
import {StyleSheet} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import NativeSplashScreen from 'react-native-splash-screen';
import AppNavigation from './navigation/AppNavigation';
import SplashScreen from './screens/SplashScreen';
import {persistorStore, staticStore, store} from './redux/store';
import {STATIC_APP_FLOW} from './config/appMode';

export default function NewFlowApp() {
  useEffect(() => {
    NativeSplashScreen.hide();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <Provider store={STATIC_APP_FLOW ? staticStore : store}>
        <SafeAreaProvider>
          {STATIC_APP_FLOW ? (
            <NavigationContainer>
              <AppNavigation />
            </NavigationContainer>
          ) : (
            <PersistGate persistor={persistorStore} loading={<SplashScreen />}>
              <NavigationContainer>
                <AppNavigation />
              </NavigationContainer>
            </PersistGate>
          )}
        </SafeAreaProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({root: {flex: 1}});
