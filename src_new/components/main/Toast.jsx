import React, {useEffect, useRef, useState} from 'react';
import {Animated, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {Text} from '../Typography';

// Tiny app-wide toast: call showToast('message') from anywhere; <ToastHost />
// (mounted once in App.jsx) renders it above the tab bar for ~2s.
let listener = null;

export function showToast(message, icon = 'check-circle') {
  if (listener) {
    listener({message, icon, id: Date.now()});
  }
}

export function ToastHost() {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef(null);

  useEffect(() => {
    listener = next => {
      clearTimeout(timer.current);
      setToast(next);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }).start();
      timer.current = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }).start(() => setToast(null));
      }, 1800);
    };
    return () => {
      listener = null;
      clearTimeout(timer.current);
    };
  }, [opacity]);

  if (!toast) {
    return null;
  }
  return (
    <View
      pointerEvents="none"
      style={[styles.wrap, {bottom: insets.bottom + 90}]}>
      <Animated.View
        style={[styles.toast, {opacity}]}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite">
        <MaterialIcons name={toast.icon} size={18} color="#FFFFFF" />
        <Text style={styles.text}>{toast.message}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {position: 'absolute', left: 16, right: 16, alignItems: 'center'},
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: 'rgba(20,24,50,0.94)',
    maxWidth: '100%',
  },
  text: {fontSize: 13, color: '#FFFFFF', fontWeight: '600'},
});
