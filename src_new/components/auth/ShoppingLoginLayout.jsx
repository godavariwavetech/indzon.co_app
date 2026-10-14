import React from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Svg, {Path} from 'react-native-svg';

const benefits = [
  {
    title: 'Fast Delivery',
    caption: 'At your doorstep',
    path: 'M3 5h11v12H3z M14 10h4l3 4v3h-7 M7 17a2 2 0 1 0 0 .01 M18 17a2 2 0 1 0 0 .01',
  },
  {
    title: 'Trusted Products',
    caption: 'Quality assured',
    path: 'M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6z M8 12l3 3 5-6',
  },
  {
    title: 'Best Deals',
    caption: 'Save more',
    path: 'M13 3h7v7L10 20 3 13z M16 7h.01',
  },
];

export default function ShoppingLoginLayout({children, navigation}) {
  const {width} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const contentWidth = Math.min(width, 480);
  const footerHeight = 126 + insets.bottom;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag">
        <View style={[styles.page, {maxWidth: contentWidth}]}>
          <View style={[styles.hero, {height: contentWidth * 0.81}]}>
            <Image
              source={require('../../assets/auth/shopping-hero.png')}
              style={{width: contentWidth, height: contentWidth * (542 / 582)}}
              resizeMode="contain"
              accessible={false}
              testID="login-shopping-artwork"
            />
          </View>
          <View style={styles.card}>{children}</View>
          <View style={styles.benefits}>
            {benefits.map((benefit, index) => (
              <View key={benefit.title} style={styles.benefit}>
                {index > 0 ? <View style={styles.divider} /> : null}
                <View style={styles.iconCircle}>
                  <Svg width={22} height={22} viewBox="0 0 24 24">
                    <Path
                      d={benefit.path}
                      fill="none"
                      stroke="#243FFF"
                      strokeWidth={1.3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitCaption}>{benefit.caption}</Text>
              </View>
            ))}
          </View>
          <View style={styles.spacer} />
          <View
            style={[
              styles.footer,
              {
                height: footerHeight,
                paddingBottom: Math.max(insets.bottom, 18),
              },
            ]}>
            <Svg
              style={styles.waves}
              width={contentWidth}
              height={footerHeight}
              viewBox="0 0 393 145"
              preserveAspectRatio="none">
              <Path
                d="M0 33C85 23 82 19 148 36S309 8 393 54V145H0Z"
                fill="#EEF5FF"
              />
              <Path
                d="M0 66C67 21 108 18 170 43S310 116 393 28V145H0Z"
                fill="#DCEAFF"
              />
              <Path
                d="M0 143C69 89 105 78 173 103S304 170 393 104V145H0Z"
                fill="#BAD7FF"
              />
            </Svg>
            <Text style={styles.agreement}>
              By continuing, you agree to our
            </Text>
            <Text style={styles.legal}>
              <Text
                accessibilityRole="link"
                onPress={() => navigation.navigate('TermsConditions')}>
                Terms of Service
              </Text>
              {' & '}
              <Text
                accessibilityRole="link"
                onPress={() => navigation.navigate('PrivacyPolicy')}>
                Privacy Policy
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#F8FBFF'},
  content: {flexGrow: 1, alignItems: 'center'},
  page: {width: '100%', flexGrow: 1},
  hero: {width: '100%', overflow: 'hidden', backgroundColor: '#EDF4FF'},
  card: {
    marginHorizontal: 20,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 18,
    shadowColor: '#9BB8DE',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 2,
  },
  benefits: {flexDirection: 'row', marginHorizontal: 14, marginTop: 30},
  benefit: {flex: 1, alignItems: 'center'},
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EDF3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  divider: {
    position: 'absolute',
    left: 0,
    top: 12,
    bottom: 4,
    width: 1,
    backgroundColor: '#E7EFFB',
  },
  benefitTitle: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
    color: '#050A36',
  },
  benefitCaption: {fontSize: 9, lineHeight: 14, color: '#536892'},
  spacer: {flexGrow: 1, minHeight: 24},
  footer: {
    paddingTop: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waves: {position: 'absolute', top: 0, left: 0},
  agreement: {fontSize: 10, lineHeight: 16, color: '#142351'},
  legal: {fontSize: 10, lineHeight: 16, color: '#173CFF'},
});
