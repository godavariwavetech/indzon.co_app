import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ImageBackground } from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons';
import commonStyles from '../../commonstyles/CommonStyles';
import OnboardingLogo from './svg/OnboardingLogo';
import { useNavigation } from '@react-navigation/native';
import { responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import OnboardingLogo1 from './tabassets/OnboardingLogo1';
import { SystemBars } from 'react-native-edge-to-edge';

const OnboardingScreen = () => {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={() => navigation.replace('Register')}>
        <Text style={styles.skipText}>Skip</Text>
        <Ionicons name="arrow-forward-circle" size={24} color="#FF9800" />
      </TouchableOpacity>
      <View style={styles.imgContainer}>
        <Image 
        source={require("../daddy/tabassets/onBoard1.png")}
        // style={{
        //   height
        // }}
        />
        {/* <OnboardingLogo1 /> */}
      </View>

      <ImageBackground
        source={require('./tabassets/your-onboarding-image.png')}
        style={styles.textImageBackground}
        imageStyle={{ resizeMode: 'contain' }}
      >

        <TouchableOpacity style={styles.nextButton} onPress={() => navigation.replace("Register")}>
          <AntDesign name="arrowright" size={25} color="#FE4A31" />
        </TouchableOpacity>
      </ImageBackground>
      {/* </View> */}
    </SafeAreaView>
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: commonStyles.bgColor,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: responsiveHeight(2.5),
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF1E6',
    // paddingHorizontal: 12,
    paddingLeft: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FF9800", gap: 6
  },
  skipText: {
    color: '#F07100',
    fontWeight: '400',
    // marginRight: 5,
    fontSize: 14
  },
  image: {
    width: '100%',
    height: 300,
    // marginTop: 100,
    justifyContent: 'center',
    alignItems: 'center'
  },
  imgContainer: {
    marginTop: responsiveHeight(4),
    justifyContent: 'center',
    alignItems: 'center'
  },
  textContainer: {
    alignItems: 'center',
    marginTop: responsiveHeight(1),
    // paddingHorizontal: 20,
    width: '82%',
    borderWidth: 0.3,
    borderColor: commonStyles.appMainColor,
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: responsiveHeight(2),
    // borderRadius:40
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    backgroundColor: commonStyles.bgColor
  },
  textImageBackground: {
    width: '100%',
    height: 300,
    alignItems: 'center',
    justifyContent: 'flex-end', // <-- This pushes children to the bottom
    paddingBottom: 50, // <-- Add space from bottom if needed
    marginTop: responsiveHeight(-3),
  },
  title: {
    fontSize: 25,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
    // color:'#101811'
    color: "#fff"
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    color: '#fff',
    marginBottom: 20,
    fontWeight: '400'
  },
  pagination: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6B1F15',
    marginHorizontal: 5,
  },
  dotActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    marginHorizontal: 5,
  },
  nextButton: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 50,
    marginTop: responsiveHeight(0.3),
    // width:58,height:58,
    // alignItems:'center',justifyContent:'center',
  },
});
