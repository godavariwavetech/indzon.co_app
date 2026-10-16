import React, {forwardRef, useEffect, useRef, useState} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image as NativeImage,
  StyleSheet,
  View,
} from 'react-native';

export function SkeletonBlock({width, height, style}) {
  return (
    <View style={[styles.block, {width, height}, style]} accessible={false} />
  );
}

export function SkeletonGroup({children, style}) {
  const opacity = useRef(new Animated.Value(0.6)).current;
  const [reduceMotion, setReduceMotion] = useState(true);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then(value => {
        if (active) {
          setReduceMotion(value);
        }
      })
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(0.75);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
          isInteraction: false,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity, reduceMotion]);
  return (
    <Animated.View
      pointerEvents="none"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[style, {opacity}]}>
      {children}
    </Animated.View>
  );
}

// App artwork is bundled locally, so render it directly through the native
// image view instead of wrapping it in a second absolute-positioned view.
export const LoadingImage = forwardRef(function LoadingImage(
  {source, resizeMethod = 'auto', fadeDuration = 0, ...props},
  ref,
) {
  return (
    <NativeImage
      {...props}
      source={source}
      resizeMethod={resizeMethod}
      fadeDuration={fadeDuration}
      ref={ref}
    />
  );
});

export function CategoryGridSkeleton({cardWidth, compact = true}) {
  return (
    <SkeletonGroup style={styles.grid}>
      {Array.from({length: 8}, (_, index) => (
        <View key={index} style={[styles.card, {width: cardWidth}]}>
          {compact ? (
            <>
              <SkeletonBlock width="84%" height={12} />
              <SkeletonBlock width="65%" height={12} style={{marginTop: 6}} />
              <SkeletonBlock
                height={compact ? 72 : 48}
                style={{marginTop: 10, alignSelf: 'stretch', borderRadius: 8}}
              />
              <View style={styles.footer}>
                <SkeletonBlock width={36} height={10} />
                <SkeletonBlock
                  width={18}
                  height={18}
                  style={{borderRadius: 9}}
                />
              </View>
            </>
          ) : (
            <View style={{flexDirection: 'row', gap: 8, alignItems: 'center'}}>
              <View style={{flex: 1}}>
                <SkeletonBlock width="90%" height={12} />
                <SkeletonBlock width="68%" height={12} style={{marginTop: 6}} />
                <View style={styles.footer}>
                  <SkeletonBlock width={28} height={10} />
                  <SkeletonBlock
                    width={18}
                    height={18}
                    style={{borderRadius: 9}}
                  />
                </View>
              </View>
              <SkeletonBlock
                width={Math.floor(cardWidth * 0.4)}
                height={90}
                style={{borderRadius: 9}}
              />
            </View>
          )}
        </View>
      ))}
    </SkeletonGroup>
  );
}

export function AddressListSkeleton() {
  return (
    <SkeletonGroup style={{padding: 16, gap: 20}}>
      {[0, 1, 2].map(index => (
        <View key={index} style={styles.address}>
          <View style={{flexDirection: 'row', gap: 12}}>
            <SkeletonBlock width={40} height={40} style={{borderRadius: 11}} />
            <View style={{flex: 1}}>
              <SkeletonBlock width="42%" height={16} />
              <SkeletonBlock width="76%" height={13} style={{marginTop: 12}} />
              <SkeletonBlock width="100%" height={12} style={{marginTop: 12}} />
              <SkeletonBlock width="82%" height={12} style={{marginTop: 7}} />
            </View>
          </View>
          <View style={[styles.footer, {marginTop: 20}]}>
            <SkeletonBlock width="30%" height={14} />
            <SkeletonBlock width="46%" height={14} />
          </View>
        </View>
      ))}
    </SkeletonGroup>
  );
}
const styles = StyleSheet.create({
  block: {backgroundColor: '#E2E6EF', borderRadius: 5},
  grid: {flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: '100%'},
  card: {
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EDF0F5',
    backgroundColor: '#F8F9FC',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 9,
  },
  address: {
    backgroundColor: '#F8F9FC',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDF0F5',
  },
});
