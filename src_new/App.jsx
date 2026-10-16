import React, {useCallback, useEffect, useRef, useState} from 'react';
import {StyleSheet} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import NativeSplashScreen from 'react-native-splash-screen';
import AppNavigation from './navigation/AppNavigation';
import SplashScreen from './screens/SplashScreen';
import {
  persistorStore,
  staticPersistor,
  staticStore,
  store,
} from './redux/store';
import {STATIC_APP_FLOW} from './config/appMode';

export default function NewFlowApp() {
  const [splashFinished, setSplashFinished] = useState(false);
  const splashTimer = useRef(null);
  const onLogoReady = useCallback(() => {
    if (splashTimer.current !== null) return;
    NativeSplashScreen.hide();
    splashTimer.current = setTimeout(() => setSplashFinished(true), 1600);
  }, []);
  useEffect(() => () => clearTimeout(splashTimer.current), []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <Provider store={STATIC_APP_FLOW ? staticStore : store}>
        <SafeAreaProvider>
          <PersistGate
            persistor={STATIC_APP_FLOW ? staticPersistor : persistorStore}>
            {bootstrapped =>
              bootstrapped && splashFinished ? (
                <NavigationContainer>
                  <AppNavigation />
                </NavigationContainer>
              ) : (
                <SplashScreen onLogoReady={onLogoReady} />
              )
            }
          </PersistGate>
        </SafeAreaProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({root: {flex: 1}});
