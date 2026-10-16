import {Text} from '../../components/Typography';
import React, {useEffect, useRef, useState} from 'react';
import {
  FlatList,
  ImageBackground,
  Pressable,
  StatusBar,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import AuthButton from '../../components/auth/AuthButton';
import {
  ONBOARDING_STORAGE_KEY,
  authFlowColors as colors,
  onboardingSlides,
} from '../../config/authFlow';

export default function OnboardingScreen({navigation}) {
  const {width} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeRef = useRef(0);
  const [leaving, setLeaving] = useState(false);
  const finishBusy = useRef(false);

  useEffect(() => {
    listRef.current?.scrollToOffset({
      offset: activeRef.current * width,
      animated: false,
    });
  }, [width]);

  const finish = async () => {
    if (finishBusy.current) {
      return;
    }
    finishBusy.current = true;
    setLeaving(true);
    try {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    } catch {
      // Sign-in remains available if onboarding preferences cannot be stored.
    }
    navigation.replace('Login');
  };

  const next = () => {
    if (activeIndex === onboardingSlides.length - 1) {
      finish();
      return;
    }
    const index = Math.min(activeIndex + 1, onboardingSlides.length - 1);
    activeRef.current = index;
    setActiveIndex(index);
    listRef.current?.scrollToOffset({offset: index * width, animated: true});
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <FlatList
        ref={listRef}
        data={onboardingSlides}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        onMomentumScrollEnd={event => {
          const index = Math.max(
            0,
            Math.min(
              onboardingSlides.length - 1,
              Math.round(event.nativeEvent.contentOffset.x / width),
            ),
          );
          activeRef.current = index;
          setActiveIndex(index);
        }}
        renderItem={({item}) => (
          <ImageBackground
            source={item.image}
            resizeMode="cover"
            accessibilityLabel={item.imageLabel}
            style={[styles.slide, {width}]}>
            <LinearGradient
              colors={['rgba(255,255,255,0.93)', 'rgba(255,255,255,0)']}
              style={[styles.headline, {paddingTop: insets.top + 96}]}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.emphasis}>{item.emphasis}</Text>
            </LinearGradient>
          </ImageBackground>
        )}
      />
      <Pressable
        onPress={finish}
        disabled={leaving}
        accessibilityRole="button"
        style={[styles.skip, {top: insets.top + 16}]}
        testID="onboarding-skip">
        <Text style={styles.skipText}>Skip →</Text>
      </Pressable>
      <View style={[styles.footer, {paddingBottom: insets.bottom + 24}]}>
        <View
          style={styles.dots}
          accessibilityLabel={`Slide ${activeIndex + 1} of ${
            onboardingSlides.length
          }`}>
          {onboardingSlides.map((slide, index) => (
            <View
              key={slide.id}
              style={[styles.dot, index === activeIndex && styles.activeDot]}
            />
          ))}
        </View>
        <AuthButton
          label={
            activeIndex === onboardingSlides.length - 1 ? 'Get started' : 'Next'
          }
          onPress={next}
          loading={leaving}
          testID="onboarding-next"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: colors.background},
  slide: {flex: 1},
  headline: {paddingHorizontal: 24, paddingBottom: 72},
  title: {
    color: colors.text,
    fontSize: 28,
    lineHeight: 36,
    textAlign: 'center',
  },
  emphasis: {
    color: colors.primary,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    textAlign: 'center',
  },
  skip: {
    position: 'absolute',
    right: 24,
    backgroundColor: colors.background,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  skipText: {color: colors.primary, fontSize: 14, fontWeight: '600'},
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: 'rgba(0,55,61,0.72)',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 8,
  },
  dot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  activeDot: {width: 24, backgroundColor: colors.background},
});
