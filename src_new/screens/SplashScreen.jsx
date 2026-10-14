import React from 'react';
import {ActivityIndicator, Image, StyleSheet, Text, View} from 'react-native';
import {authAssets} from '../assets';
import {authFlowColors as colors} from '../config/authFlow';

export default function SplashScreen() {
  return (
    <View style={styles.root}>
      <Image
        source={authAssets.appIcon}
        style={styles.icon}
        resizeMode="contain"
        accessibilityLabel="App logo"
      />
      <Text style={styles.title}>Amaraa</Text>
      <ActivityIndicator
        color={colors.primary}
        style={styles.loader}
        accessibilityLabel="Loading"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  icon: {width: 96, height: 96, borderRadius: 20},
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 20,
  },
  loader: {marginTop: 32},
});
