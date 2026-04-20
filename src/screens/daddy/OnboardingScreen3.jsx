
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, SafeAreaView ,StatusBar} from 'react-native';
import  AntDesign  from 'react-native-vector-icons/AntDesign'; 
import  Ionicons  from 'react-native-vector-icons/Ionicons';
import commonStyles from '../../commonstyles/CommonStyles';
import OnboardingLogo from './svg/OnboardingLogo';
import { useNavigation, useRoute } from '@react-navigation/native';
import { responsiveHeight ,responsiveWidth } from 'react-native-responsive-dimensions';
import OnboardingLogo1 from './tabassets/OnboardingLogo1';
import OnboardingLogo2 from './tabassets/OnboardingLogo2';

const OnboardingScreen3 = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const phone = route.params?.phone || '';
  return (
    <SafeAreaView style={styles.container}>
       {/* <StatusBar barStyle="dark-content" backgroundColor={commonStyles.bgColor} /> */}
     

     
      <View style={styles.imgContainer}>
        
      </View>
      <Image source={require('../daddy/svg/deliveryBoy.png')} style={styles.image} resizeMode='contain'/>
    
     

      <View style={styles.textContainer}>
         {/* Pagination dots */}
        <View style={styles.pagination}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dotActive} />
        </View> 

        <TouchableOpacity style={styles.skipButton} onPress={() => navigation.replace('ServiceLocations')}>
          <Ionicons name="location-outline" size={24} color="#FE4A31" />
          <Text style={styles.skipText}>Select your service location</Text>
        </TouchableOpacity>

        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>Terms and Conditions</Text>
          <Text style={styles.termsText}>Privacy Policy</Text>
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={() => navigation.replace('Register', { phone })}> 
          <AntDesign name="arrowright" size={25} color="#FE4A31" />
        </TouchableOpacity>
      </View>
      {/* </View> */}
    </SafeAreaView>
  );
};

export default OnboardingScreen3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: commonStyles.bgColor,
    alignItems: 'center',justifyContent:'center'
    // paddingTop: 20,
  },
  image: {
    width: 270,height:405
    // height: 300,
    // marginTop: 100,
    // justifyContent: 'center',
    // alignItems: 'center'
  },
  imgContainer:{
    // marginTop: responsiveHeight(4),
    justifyContent: 'center',
    alignItems: 'center'
  },
  textContainer: {
    alignItems: 'center',
    width:'90%',
    borderWidth:0.3,
    borderColor:commonStyles.appMainColor,
    paddingHorizontal:responsiveWidth(4),
    paddingVertical:responsiveHeight(2),
    backgroundColor:'#FE4A31',
    // borderRadius:40
    borderTopLeftRadius:10,
    borderTopRightRadius:10,
    borderBottomLeftRadius:40,
    borderBottomRightRadius:40,
    // borderBottomRightRadius:100
  },
  termsContainer:{
    flexDirection:'column',
    // justifyContent:'space-between',
    alignItems:'center',
    justifyContent:'center',
    gap:10,
    width:'100%',
    marginBottom:responsiveHeight(1.5),
  },  
  
  termsText:{
    fontSize:16,
    fontWeight:'600',
    color:'#fff',
    textDecorationLine:'underline',
    textAlign:'center'
  },
  title: {
    fontSize: 25,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
    // color:'#101811'
    color:commonStyles.appMainColor
  },
  skipButton:{
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'center',
    gap:10,
    marginBottom:responsiveHeight(2),
    width:'100%',
    borderWidth:0.3,
    borderColor:commonStyles.appMainColor,
    paddingVertical:responsiveHeight(1.5),
    backgroundColor:'#fff',
    borderRadius:10,
  },
  skipText:{
    fontSize:16,
    fontWeight:'600',
    color:commonStyles.appMainColor
  },

  description: {
    fontSize: 14,
    textAlign: 'center',
    color: '#101811',
    marginBottom: 20,
    fontWeight:'400'
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
    marginTop:responsiveHeight(0.3),
    // width:58,height:58,
    // alignItems:'center',justifyContent:'center',
  },
});
