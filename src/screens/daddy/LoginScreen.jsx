import React ,{useState} from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,StatusBar,Text,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Svg, Path } from 'react-native-svg'; // For the arrow icon
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import commonStyles from '../../commonstyles/CommonStyles';
import  AntDesign  from 'react-native-vector-icons/AntDesign'; 
import { useNavigation } from '@react-navigation/native';
import StatusBarManager from '../../components/StatusBarManager';


const { width, height } = Dimensions.get('window');

const LoginScreen = () => {
  const [phone, setPhone] = useState('');
  const [error,setError] = useState('');
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();


  const handleLogin=async()=>{
    navigation.navigate('SetLocationScreen');

    // if (!phone) {setError('Phone number is required!'); return}
    // const phoneRegex = /^[6-9]\d{9}$/;

    // if (!phoneRegex.test(phone)) {
    //     setError("Invalid phone number");
    //     return false;
    // }else{
    //   navigation.navigate('SetLocationScreen');
    
    //   setError('')
    // }

    // const responseData =await dispatch(verifyMobile({mobileNumber:phone}))

    
    // if(responseData.payload.status){
    //   dispatch(setMobile(phone))
    //   navigation.navigate('OTPVerificationScreen',{otp:responseData.payload.data[0]?.otp,mobileNumber:phone})
    // }else{
    //   Alert.alert("Error","Please try again")
    // }
}

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={{ flex: 1, backgroundColor: commonStyles.bgColor }}>
        <StatusBarManager screenName="login" />

        <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.imageContainer}>
            <Image
              source={require('./svg/LoginImg.png')}
              style={styles.image}
              resizeMode="contain"
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
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
            />
            <Text style={styles.errorText}>{error}</Text>

            <TouchableOpacity style={styles.nextButton} onPress={handleLogin}>
              <AntDesign name="arrowright" size={25} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

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
  input: {
    width: '100%',
    height: 50,
    borderWidth: 0.5,
    borderColor: '#D6BA00',
    borderRadius: 8,
    paddingHorizontal: 20,
    fontSize: 16,
    marginBottom: 10,
    backgroundColor: '#fff',
    fontWeight:'500',paddingVertical:10
  },
  // button: {
  //   backgroundColor: '#FFD600',
  //   borderRadius: 30,
  //   padding: 15,
  //   justifyContent: 'center',
  //   alignItems: 'center',
  //   width: 60,
  //   height: 60,
  // },
  nextButton: {
    backgroundColor: commonStyles.arrowBtnColor,
    padding: 16,
    borderRadius: 50,
    marginTop: 23,
    // width:58,height:58,
    // alignItems:'center',justifyContent:'center',
  },
  errorText: {
    // color: 'red',
    color:'#D6BA00',
    fontSize: 14,
    // alignSelf:'flex-start',
    // marginTop:4
    // marginVertical: 10,
  },
});








