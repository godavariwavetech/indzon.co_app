
import React ,{useState} from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  StatusBar,Text
} from 'react-native';
import { Svg, Path } from 'react-native-svg'; // For the arrow icon
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import commonStyles from '../../commonstyles/CommonStyles';
import  AntDesign  from 'react-native-vector-icons/AntDesign'; 
import  Ionicons  from 'react-native-vector-icons/Ionicons'; 
import { useNavigation } from '@react-navigation/native';


const { width, height } = Dimensions.get('window');

const SetLocationScreen = () => {

  const navigation = useNavigation();
  const insets = useSafeAreaInsets();




  return (
    <View style={{ flex: 1, backgroundColor: commonStyles.bgColor }}>
    {/* <StatusBar barStyle="dark-content" backgroundColor={commonStyles.bgColor}/> */}
    {/* <StatusBar barStyle="dark-content" backgroundColor={'transparent'} translucent /> */}


    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.imageContainer}>
        <Image
          source={require('./svg/deliveryBoy.png')}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      <View style={styles.inputContainer}>
        {/* <TextInput
          style={styles.input}
          placeholder="Enter Your Mobile Number"
          placeholderTextColor="#727272"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={(text) => {
            const numericText = text.replace(/[^0-9]/g, '');
            setPhone(numericText);
            setError('');
          }}
        /> */}

        <TouchableOpacity style={styles.locationBtn}>
            <Ionicons name="location-sharp" size={20} color="#FFF" />
            <Text style={[commonStyles.label,{color:'#fff'}]}>Select Our Service Location</Text>
        </TouchableOpacity>

        <View style={{flexDirection:'column',justifyContent:'center',alignItems:'center',marginTop:20,gap:8}}>
            <TouchableOpacity onPress={()=>{}}>
                <Text style={styles.tcText}>Terms & Conditions</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={()=>{}}>
                <Text style={styles.tcText}>Privacy Policy</Text>
            </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={()=> navigation.navigate('HomeScreen')}>
          <AntDesign name="arrowright" size={25} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  </View>
  );
};

export default SetLocationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: commonStyles.bgColor,
    justifyContent: 'space-between',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  image: {
    width: width * 0.8,
    height: height * 0.5,
  },

  locationBtn:{
    flexDirection:'row',
    alignItems:'center',
    gap:8,
    paddingHorizontal:20,
    paddingVertical:10,
    backgroundColor:commonStyles.arrowBtnColor,
    borderRadius:8
  },

  inputContainer: {
    // backgroundColor: 'white',
    backgroundColor:commonStyles.bgColor,
    borderRadius: 40,
    // borderTopRightRadius: 40,
    paddingVertical: 30,
    paddingHorizontal: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    // elevation: 3,
    marginHorizontal:16,
    marginBottom:20,
    borderWidth: 0.3,
    borderColor: '#FFDD44',
  },
//   input: {
//     width: '100%',
//     height: 50,
//     borderWidth: 0.5,
//     borderColor: '#D6BA00',
//     borderRadius: 8,
//     paddingHorizontal: 20,
//     fontSize: 16,
//     marginBottom: 20,
//     backgroundColor: '#fff',
//     fontWeight:'500',paddingVertical:10
//   },

  nextButton: {
    backgroundColor: commonStyles.arrowBtnColor,
    padding: 16,
    borderRadius: 50,
    marginTop: 23,
    width:58,height:58,
    alignItems:'center',justifyContent:'center',
  },
  tcText:{
    fontSize:12,
    fontWeight:'400',
    color:"#101811",
    borderBottomWidth:1,
    borderBottomColor:'#101811',
  }
});
