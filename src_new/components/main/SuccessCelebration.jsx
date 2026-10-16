import React, {useEffect, useRef} from 'react';
import {AccessibilityInfo, Animated, StyleSheet, View} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export default function SuccessCelebration({children, size = 120, loop = false}) {
  const progress = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    let active = true;
    let animation;
    const play = reduced => {
      animation?.stop();
      if (!active) {
        return;
      }
      progress.setValue(reduced ? 1 : 0);
      if (!reduced) {
        const entrance = Animated.timing(progress, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        });
        animation = loop
          ? Animated.loop(
              Animated.sequence([
                entrance,
                Animated.timing(progress, {
                  toValue: 0,
                  duration: 800,
                  useNativeDriver: true,
                }),
              ]),
            )
          : entrance;
        animation.start();
      }
    };
    AccessibilityInfo.isReduceMotionEnabled()
      .then(play)
      .catch(() => play(true));
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      play,
    );
    return () => {
      active = false;
      animation?.stop();
      subscription.remove();
    };
  }, [progress, loop]);
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {[0, 1, 2, 3, 4, 5, 6, 7].map(index => {
        const angle = (index * Math.PI) / 4;
        return (
          <Animated.View
            key={index}
            pointerEvents="none"
            style={[
              styles.spark,
              {
                backgroundColor: index % 2 ? '#32BD8A' : '#655BFF',
                opacity: progress.interpolate({
                  inputRange: [0, 0.2, 0.75, 1],
                  outputRange: [0, 1, 1, 0],
                }),
                transform: [
                  {
                    translateX: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [
                        Math.cos(angle) * size * 0.25,
                        Math.cos(angle) * size * 0.48,
                      ],
                    }),
                  },
                  {
                    translateY: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [
                        Math.sin(angle) * size * 0.25,
                        Math.sin(angle) * size * 0.48,
                      ],
                    }),
                  },
                  {rotate: `${index * 45}deg`},
                ],
              },
            ]}
          />
        );
      })}
      <Animated.View
        style={{
          transform: [
            {
              scale: progress.interpolate({
                inputRange: [0, 0.6, 0.8, 1],
                outputRange: [0.65, 1.06, 0.98, 1],
              }),
            },
          ],
        }}>
        {children || (
          <View style={styles.badge}>
            <MaterialIcons name="check" size={44} color="#FFFFFF" />
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  spark: {position: 'absolute', width: 5, height: 10, borderRadius: 3},
  badge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#19A774',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
