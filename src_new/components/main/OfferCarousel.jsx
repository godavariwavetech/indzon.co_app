import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  AccessibilityInfo,
  Animated,
  AppState,
  Image,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import {Text} from '../ReadableText';
import {useIsFocused} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export default function OfferCarousel({navigation, offers}) {
  const {width} = useWindowDimensions();
  const cardWidth = Math.min(width * 0.8, 440);
  // Image-only banners are 3:1 pictures; size the card to the picture so
  // nothing is cropped. Designed offer cards keep their fixed height.
  const imageOnly = offers.length > 0 && offers.every(offer => offer.imageOnly);
  const cardHeight = imageOnly ? Math.round(cardWidth / 3) : 216;
  const step = cardWidth + 12;
  const list = useRef(null);
  const position = useRef(1);
  const touching = useRef(false);
  const dragging = useRef(false);
  const idleTimer = useRef(null);
  const autoTimer = useRef(null);
  const completionTimer = useRef(null);
  const settleRef = useRef(null);
  const offset = useRef(step);
  const scrollX = useRef(new Animated.Value(step)).current;
  const focused = useIsFocused();
  const [slide, setSlide] = useState(0);
  const [autoplayCycle, setAutoplayCycle] = useState(0);
  const [layoutReady, setLayoutReady] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(null);
  const [appState, setAppState] = useState(AppState.currentState || 'active');
  const items = useMemo(
    () => [offers[offers.length - 1], ...offers, offers[0]],
    [offers],
  );

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then(value => {
        if (mounted) {
          setReduceMotion(value);
        }
      })
      .catch(() => {
        if (mounted) setReduceMotion(false);
      });
    const motion = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    const app = AppState.addEventListener('change', setAppState);
    return () => {
      mounted = false;
      motion.remove();
      app.remove();
    };
  }, []);

  useEffect(() => {
    if (!layoutReady) return undefined;
    const frame = requestAnimationFrame(() => {
      list.current?.scrollToOffset({
        offset: position.current * step,
        animated: false,
      });
      scrollX.setValue(position.current * step);
      offset.current = position.current * step;
    });
    return () => cancelAnimationFrame(frame);
  }, [step, scrollX, layoutReady]);

  useEffect(() => {
    touching.current = false;
    dragging.current = false;
    setInteracting(false);
    clearTimeout(idleTimer.current);
    clearTimeout(completionTimer.current);
    return () => {
      clearTimeout(idleTimer.current);
      clearTimeout(completionTimer.current);
    };
  }, [focused, appState]);

  useEffect(() => {
    if (!layoutReady || !focused || appState !== 'active' || interacting || reduceMotion !== false || offers.length < 2) {
      return undefined;
    }
    const timer = setTimeout(() => {
      if (touching.current || dragging.current) return;
      const next = position.current + 1;
      position.current = next;
      list.current?.scrollToOffset({offset: next * step, animated: true});
      // Some native scroll paths omit the completion event. Finish the snap
      // and restart the timer even when no JS momentum event arrives.
      completionTimer.current = setTimeout(() => {
        if (touching.current || dragging.current) return;
        list.current?.scrollToOffset({offset: next * step, animated: false});
        settleRef.current?.(next * step);
      }, 1000);
    }, 4000);
    autoTimer.current = timer;
    return () => clearTimeout(timer);
  }, [focused, appState, interacting, reduceMotion, slide, step, layoutReady, autoplayCycle, offers.length]);

  useEffect(() => () => {
    clearTimeout(idleTimer.current);
    clearTimeout(completionTimer.current);
  }, []);

  const settle = currentOffset => {
    clearTimeout(idleTimer.current);
    if (touching.current) return;
    clearTimeout(completionTimer.current);
    dragging.current = false;
    const raw = Math.max(
      0,
      Math.min(items.length - 1, Math.round(currentOffset / step)),
    );
    const index =
      raw === 0 ? offers.length : raw === items.length - 1 ? 1 : raw;
    position.current = index;
    offset.current = index * step;
    setSlide(index - 1);
    if (index !== raw) {
      list.current?.scrollToOffset({offset: index * step, animated: false});
      scrollX.setValue(index * step);
    }
    setInteracting(false);
    setAutoplayCycle(current => current + 1);
  };
  settleRef.current = settle;

  const pause = () => {
    clearTimeout(autoTimer.current);
    clearTimeout(idleTimer.current);
    setInteracting(true);
  };
  const scheduleSettle = () => {
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => settle(offset.current), 200);
  };

  return (
    <View>
      <Animated.FlatList
        ref={list}
        onLayout={() => setLayoutReady(true)}
        data={items}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={step}
        decelerationRate="fast"
        disableIntervalMomentum
        removeClippedSubviews={false}
        initialNumToRender={items.length}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={{
          paddingHorizontal: (width - cardWidth) / 2,
          gap: 12,
        }}
        getItemLayout={(_, index) => ({
          length: step,
          offset: step * index,
          index,
        })}
        onScroll={Animated.event(
          [{nativeEvent: {contentOffset: {x: scrollX}}}],
          {
            useNativeDriver: true,
            listener: event => {
              offset.current = event.nativeEvent.contentOffset.x;
              if (!touching.current) scheduleSettle();
            },
          },
        )}
        scrollEventThrottle={16}
        onTouchStart={() => {
          clearTimeout(completionTimer.current);
          touching.current = true;
          pause();
        }}
        onTouchEnd={() => {
          touching.current = false;
          scheduleSettle();
        }}
        onTouchCancel={() => {
          touching.current = false;
          scheduleSettle();
        }}
        onScrollBeginDrag={() => {
          clearTimeout(completionTimer.current);
          dragging.current = true;
          pause();
        }}
        onScrollEndDrag={event => {
          touching.current = false;
          offset.current = event.nativeEvent.contentOffset.x;
          scheduleSettle();
        }}
        onMomentumScrollBegin={pause}
        onMomentumScrollEnd={event => settle(event.nativeEvent.contentOffset.x)}
        renderItem={({item, index}) => (
          <View
            style={{width: cardWidth, height: cardHeight + 8, justifyContent: 'center'}}>
            <Animated.View
              style={[
                styles.card,
                {
                  height: cardHeight,
                  transform: [
                    {
                      scaleY: scrollX.interpolate({
                        inputRange: [
                          (index - 1) * step,
                          index * step,
                          (index + 1) * step,
                        ],
                        outputRange: [0.81, 1, 0.81],
                        extrapolate: 'clamp',
                      }),
                    },
                  ],
                },
              ]}>
              <Pressable
                style={[styles.fill, {backgroundColor: item.background}]}
                accessibilityRole="button"
                accessibilityLabel={`${item.title.replace(
                  '\n',
                  ' ',
                )}. Explore ${item.categoryId}`}
                onPress={() =>
                  navigation.navigate('CategoryDetails', {
                    categoryId: item.categoryId,
                    selectionRequest: Date.now(),
                  })
                }>
                <Image
                  source={item.source}
                  style={styles.photo}
                  resizeMode="cover"
                />
                {!item.imageOnly && (
                <LinearGradient
                  colors={[
                    item.background,
                    `${item.background}EE`,
                    `${item.background}00`,
                  ]}
                  locations={[0, 0.35, 0.85]}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={StyleSheet.absoluteFillObject}
                />
                )}
                {!item.imageOnly && (
                <View style={styles.copy}>
                  <Text
                    allowFontScaling={false}
                    style={[styles.eyebrow, {color: item.accent}]}>
                    {item.eyebrow}
                  </Text>
                  <Text allowFontScaling={false} style={styles.title}>
                    {item.title}
                  </Text>
                  <Text allowFontScaling={false} style={styles.caption}>
                    {item.caption}
                  </Text>
                  <View style={styles.button}>
                    <Text
                      allowFontScaling={false}
                      style={[styles.buttonText, {color: item.accent}]}>
                      Explore now
                    </Text>
                    <MaterialIcons
                      name="arrow-forward"
                      size={15}
                      color={item.accent}
                    />
                  </View>
                </View>
                )}
              </Pressable>
            </Animated.View>
          </View>
        )}
      />
      <View style={styles.controls}>
        {offers.length > 1 && offers.map((item, index) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={`Show offer ${index + 1} of ${
              offers.length
            }`}
            accessibilityState={{selected: slide === index}}
            style={styles.dotButton}
            onPress={() => {
              clearTimeout(completionTimer.current);
              clearTimeout(idleTimer.current);
              clearTimeout(autoTimer.current);
              touching.current = false;
              dragging.current = false;
              setInteracting(false);
              setAutoplayCycle(current => current + 1);
              position.current = index + 1;
              setSlide(index);
              list.current?.scrollToOffset({
                offset: (index + 1) * step,
                animated: !reduceMotion,
              });
            }}>
            <View style={[styles.dot, slide === index && styles.activeDot]} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {flex: 1},
  card: {
    height: 216,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ECE8F2',
  },
  photo: {position: 'absolute', right: 0, width: '100%', height: '100%'},
  copy: {
    width: '68%',
    flex: 1,
    padding: 14,
    paddingRight: 0,
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: 8,
    lineHeight: 11,
    letterSpacing: 0.6,
    fontWeight: '700',
    marginBottom: 7,
  },
  title: {fontSize: 20, lineHeight: 23, fontWeight: '700', color: '#242033'},
  caption: {
    fontSize: 11,
    lineHeight: 15,
    color: '#555064',
    marginTop: 6,
    maxWidth: 155,
  },
  button: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 11,
    paddingVertical: 6,
    marginTop: 12,
  },
  buttonText: {fontSize: 11, fontWeight: '700'},
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  dotButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {width: 6, height: 6, borderRadius: 4, backgroundColor: '#DCD8EB'},
  activeDot: {width: 20, backgroundColor: '#3832FF'},
});
