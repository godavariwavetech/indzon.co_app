import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {BrandLogo} from './BrandLogo';
import {LoginBackground} from './LoginBackground';
import {SigninCardHeader} from './SigninCardHeader';
import {LOGIN_DESIGN_WIDTH, loginLayout} from '../../config/login';

export default function AuthScreenLayout({children}) {
  const {width, height} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scale = Math.min(width / LOGIN_DESIGN_WIDTH, 1.4);
  const contentTop = Math.max(24 * scale, insets.top + 8);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <LoginBackground width={width} height={height} scale={scale} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: contentTop,
              paddingBottom: Math.max(32, insets.bottom + 20),
            },
          ]}>
          <View
            style={[
              styles.logo,
              {
                marginTop: Math.max(
                  0,
                  loginLayout.logoTop * scale - contentTop,
                ),
              },
            ]}>
            <BrandLogo
              width={loginLayout.logoWidth * scale}
              height={loginLayout.logoHeight * scale}
            />
          </View>
          <View
            style={{
              marginTop:
                (loginLayout.cardCanvasTop -
                  loginLayout.logoTop -
                  loginLayout.logoHeight) *
                scale,
            }}>
            <SigninCardHeader
              width={width}
              height={loginLayout.cardCanvasHeight * scale}
            />
          </View>
          <View style={styles.form}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#FFFFFF'},
  flex: {flex: 1},
  content: {flexGrow: 1},
  logo: {alignItems: 'center'},
  form: {
    flex: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
});
