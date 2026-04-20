
import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons';
import commonStyles from '../../commonstyles/CommonStyles';
import OnboardingLogo from './svg/OnboardingLogo';
import { useNavigation } from '@react-navigation/native';
import { responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import OnboardingLogo1 from './tabassets/OnboardingLogo1';
import OnboardingLogo2 from './tabassets/OnboardingLogo2';
import { TextInput } from 'react-native-gesture-handler';
 
const OnboardingScreen2 = () => {
  const navigation = useNavigation();
  const [phone, setPhone] = useState('');
  const isPhoneValid = phone.length === 10 && /^\d{10}$/.test(phone);
  return (
    <SafeAreaView style={styles.container}>
      {/* <StatusBar barStyle="dark-content" backgroundColor={commonStyles.bgColor} /> */}
     
      <View style={styles.imgContainer}>
        <OnboardingLogo2 />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 150}
        style={{ width: '100%' }}
      >
        <ScrollView
          style={{ width: '100%' }}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.textContainer}>
            {/* Pagination dots */}
            <View style={styles.pagination}>
              <View style={styles.dot} />
              <View style={styles.dotActive} />
              <View style={styles.dot} />
            </View>

            <TextInput
              style={styles.input}
              placeholder='Enter your phone number'
              value={phone}
              onChangeText={setPhone}
              keyboardType="numeric"
              maxLength={10}
            />

            <TouchableOpacity
              style={[styles.nextButton, { opacity: isPhoneValid ? 1 : 0.5 }]}
              onPress={() => navigation.replace('OnboardingScreen3', { phone })}
              disabled={!isPhoneValid}
            >
              <AntDesign name="arrowright" size={25} color="#FE4A31" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default OnboardingScreen2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: commonStyles.bgColor,
    alignItems: 'center', justifyContent: 'center'
    // paddingTop: 20,
  },
  skipButton: {
    position: 'absolute',
    top: 15,
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
    height: '65%'
    // height: 300,
    // marginTop: 100,
    // justifyContent: 'center',
    // alignItems: 'center'
  },
  imgContainer: {
    // marginTop: responsiveHeight(1),
    justifyContent: 'center',
    alignItems: 'center',
    // width:'90%',
    // height:'50%'
  },

  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    marginBottom: responsiveHeight(2),
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },

  textContainer: {
    alignItems: 'center',
    marginTop: responsiveHeight(0.5),
    width: '90%',
    borderWidth: 0.3,
    borderColor: commonStyles.appMainColor,
    paddingHorizontal: responsiveWidth(4),
    paddingVertical: responsiveHeight(2),
    // borderRadius:40
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    backgroundColor: "#FE4A31"
  },
  title: {
    fontSize: 25,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
    // color:'#101811'
    color: commonStyles.appMainColor
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    color: '#101811',
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
