// import {
//   View,
//   Text,
//   StyleSheet,
//   StatusBar,
//   ImageBackground,
//   TextInput,
//   TouchableOpacity,
//   Pressable,
//   Keyboard,
//   ActivityIndicator,
// } from 'react-native';
// import React, {useEffect, useState} from 'react';
// import AuthBackground from './tabassets/AuthBackground';
// import {
//   responsiveHeight,
//   responsiveWidth,
// } from 'react-native-responsive-dimensions';
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import FontAwesome from 'react-native-vector-icons/FontAwesome';
// // import GoogleIcon from '../user/svgs/GoogleIcon';
// import { actionLogin, setInitial, verifyCustomerMobile } from '../../redux/reducers/auth';
// import { useDispatch, useSelector } from 'react-redux';
// import CustomModal from '../../components/CustomModal';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
// // import CustomModal from '../components/CustomModal';

// export default function Register({navigation,route}) {
//   const [passwordVisible, setPasswordVisible] = useState(false);
//   const [phoneNumber, setPhoneNumber] = useState('');
//   const [modalVisible, setModalVisible] = useState(false);
//   const [modalContent, setModalContent] = useState({
//     title: '',
//     message: ''
//   });
//   const dispatch = useDispatch();
//   const loading = useSelector(state => state.Auth.loading);



//   const showErrorModal = (title, message) => {
//     setModalContent({title, message});
//     setModalVisible(true);
//   };

//   const validatePhoneNumber = () => {
//     if (!phoneNumber) {
//       showErrorModal('Validation Error', 'Phone number is required');
//       return false;
//     } else if (!/^[0-9]{10}$/.test(phoneNumber)) {
//       showErrorModal('Validation Error', 'Please enter a valid 10-digit phone number');
//       return false;
//     }
//     return true;
//   };

//   const handleRequestOTP = async() => {
//     if (validatePhoneNumber()) {
//       try {
//         const response = await dispatch(verifyCustomerMobile({customer_mobile_number: phoneNumber}));

//         if(response.payload && !response.error){
//           navigation.navigate(route.params?.isFromCart ? "OTPVerification1" : "OTPVerification",{
//             phoneNumber: phoneNumber,
//             otp: response.payload.loginotp,
//             isFromCart: route.params?.isFromCart||null
//           });
//         } else {
//           showErrorModal('API Error', 'Failed to send OTP. Please try again.');
//         }
//       } catch (error) {
//         showErrorModal('Network Error', 'Failed to connect to the server. Please check your internet connection.');
//       }
//     }
//   };

//   useEffect(()=>{
//     dispatch(setInitial())
//   },[])

//   return (
//     <Pressable style={{flex:1}} onPress={()=>Keyboard.dismiss()} >
//       <View style={styles.main}>
//         <CustomModal
//           visible={modalVisible}
//           title={modalContent.title}
//           message={modalContent.message}
//           onConfirm={() => setModalVisible(false)}
//           confirmText="OK"
//           cancelText={null}
//         />
//         {loading && (
//           <View style={styles.loaderContainer}>
//             <ActivityIndicator size="large" color="#065E2C" />
//           </View>
//         )}
//         <StatusBar translucent hidden />
//         <ImageBackground
//           source={require('./tabassets/authbg.png')}
//           resizeMode="stretch"
//           style={{
//             width: responsiveWidth(100),
//             height: responsiveHeight(30),
//             backgroundColor: '#065E2C',
//             justifyContent: "flex-end"
//           }}>
//           <Text style={{color:"#FFF",fontSize:32,fontWeight:"700",bottom:0,marginBottom:responsiveHeight(8),marginLeft:responsiveWidth(10)}}>
//             Sign In
//           </Text>
//         </ImageBackground>
//         <View
//           style={{
//             flex: 1,
//             backgroundColor: '#fff',
//             transform: [{translateY: -responsiveHeight(4.5)}],
//             borderTopLeftRadius: 24,
//             borderTopRightRadius: 24,
//             paddingHorizontal: responsiveWidth(5),
//             paddingVertical: responsiveHeight(3),
//           }}>
//           <Text
//             style={{
//               color: '#3D3D3D',
//               textAlign: 'center',
//               fontSize: 20,
//               fontWeight: '500',
//             }}>
//             Please enter your phone number to continue
//           </Text>
//           <View style={{marginTop: responsiveHeight(5)}}>
//             <Text style={styles.label}>Phone Number</Text>
//             <TextInput
//               style={styles.input}
//               placeholder="Enter Phone Number"
//               placeholderTextColor={'#3D3D3D'}
//               keyboardType="phone-pad"
//               value={phoneNumber}
//               onChangeText={(text) => setPhoneNumber(text)}
//               maxLength={10}
//             />
//           </View>

//           <TouchableOpacity onPress={handleRequestOTP} style={styles.loginButton}>
//             <Text style={styles.loginText}>Request OTP</Text>
//           </TouchableOpacity>

//         {route.params?.isFromCart ? null :  <TouchableOpacity 
//             style={styles.skipButton}
//             onPress={() => dispatch(actionLogin())}
//           >
//             <Text style={styles.skipText}>Skip for Now</Text>
//             <MaterialIcons name="arrow-forward" size={20} color="#065E2C" />
//           </TouchableOpacity>}
//         </View>
//       </View>
//     </Pressable>
//   );
// }

// const styles = StyleSheet.create({
//   main: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   loaderContainer: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(255, 255, 255, 0.7)',
//     zIndex: 1,
//   },
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//   },
//   label: {
//     fontSize: 17,
//     fontWeight: '500',
//     marginBottom: 5,
//   },
//   input: {
//     padding: 12,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: '#666',
//     color: '#000',
//     fontWeight: 'condensed',
//   },
//   passwordContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'white',
//     paddingHorizontal: 12,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: '#666',
//   },
//   passwordInput: {
//     flex: 1,
//     color: '#000',
//   },
//   icon: {
//     paddingHorizontal: 10,
//   },
//   rememberContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//   },
//   checkbox: {
//     width: 18,
//     height: 18,
//     borderWidth: 1,
//     borderColor: '#ccc',
//     borderRadius: 3,
//     marginRight: 5,
//   },
//   rememberText: {
//     fontSize: 13,
//     color: '#7E8A97',
//     fontWeight: '400',
//   },
//   forgotPassword: {
//     fontSize: 14,
//     color: '#065E2C',
//     fontWeight: '400',
//   },
//   loginButton: {
//     backgroundColor: '#065E2C',
//     paddingVertical: 12,
//     borderRadius: 8,
//     alignItems: 'center',
//     marginTop: responsiveHeight(5),
//   },
//   loginText: {
//     color: 'white',
//     fontSize: 18,
//     fontWeight: '700',
//   },
//   signupText: {
//     textAlign: 'center',
//     fontSize: 14,
//     color: '#646982',
//     fontWeight: '400',
//   },
//   signupLink: {
//     color: '#065E2C',
//     fontWeight: 'bold',
//     fontSize: 14,
//   },
//   orText: {
//     textAlign: 'center',
//     fontSize: 16,
//     color: '#646982',
//   },
//   socialContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     marginTop: 10,
//   },
//   socialButton: {
//     backgroundColor: '#395998',
//     width: 62,
//     height: 62,
//     borderRadius: 50,
//     marginHorizontal: 10,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   skipButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 12,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: '#065E2C',
//     backgroundColor: 'transparent',
//     marginTop: responsiveHeight(2),
//     marginHorizontal: responsiveWidth(1),
//   },
//   skipText: {
//     color: '#065E2C',
//     fontSize: 16,
//     fontWeight: '600',
//     marginRight: 8,
//   },
// });




//food trial

import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ImageBackground,
  TextInput,
  TouchableOpacity,
  Pressable,
  Keyboard,
  ActivityIndicator, Image
} from 'react-native';
import React, { useEffect, useState } from 'react';
import AuthBackground from './tabassets/AuthBackground';
import {
  responsiveHeight,
  responsiveWidth,
} from 'react-native-responsive-dimensions';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
// import GoogleIcon from '../user/svgs/GoogleIcon';
import { actionLogin, setInitial, verifyCustomerMobile } from '../../redux/reducers/auth';
import { useDispatch, useSelector } from 'react-redux';
import CustomModal from '../../components/CustomModal';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import commonStyles from '../../commonstyles/CommonStyles';
// import CustomModal from '../components/CustomModal';

export default function Register({ navigation, route }) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: '',
    message: ''
  });
  const dispatch = useDispatch();
  const loading = useSelector(state => state.Auth.loading);



  const showErrorModal = (title, message) => {
    setModalContent({ title, message });
    setModalVisible(true);
  };

  const validatePhoneNumber = () => {
    if (!phoneNumber) {
      showErrorModal('Validation Error', 'Phone number is required');
      return false;
    } else if (!/^[0-9]{10}$/.test(phoneNumber)) {
      showErrorModal('Validation Error', 'Please enter a valid 10-digit phone number');
      return false;
    }
    return true;
  };

  const handleRequestOTP = async () => {
    if (validatePhoneNumber()) {
      try {
        const response = await dispatch(verifyCustomerMobile({ customer_mobile_number: phoneNumber }));
        console.log("response of verifyCustomerMobile", response)
        if (response.payload && !response.error) {
          navigation.navigate(route.params?.isFromCart ? "OTPVerification1" : "OTPVerification", {
            phoneNumber: phoneNumber,
            otp: response.payload.loginotp,
            isFromCart: route.params?.isFromCart || null
          });
        } else {
          showErrorModal('API Error', 'Failed to send OTP. Please try again.');
        }
      } catch (error) {
        showErrorModal('Network Error', 'Failed to connect to the server. Please check your internet connection.');
      }
    }
  };

  useEffect(() => {
    dispatch(setInitial())
    if (route.params?.phone) {
      setPhoneNumber(route.params.phone);
    }
  }, [])

  return (
    <Pressable style={{ flex: 1, backgroundColor: '#FE4A31' }} onPress={() => Keyboard.dismiss()} >
      <View style={styles.topSection} />
      {/* Absolutely positioned logo */}
      <View style={styles.logoCircle}>
        <Image
          source={require('./tabassets/chillbroLogo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>
      {/* White Card Section */}
      <View style={styles.cardSection}>
        <Text style={styles.signInTitle}>Sign Up</Text>
        <Text style={styles.subtitle}>Please enter your phone number to continue</Text>
        <View style={{ marginTop: responsiveHeight(0) }}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Phone Number"
            placeholderTextColor={'#3D3D3D'}
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={(text) => setPhoneNumber(text)}
            maxLength={10}
          />
        </View>
        <TouchableOpacity onPress={handleRequestOTP} style={styles.loginButton}>
          <Text style={styles.loginText}>Request OTP</Text>
        </TouchableOpacity>
        {route.params?.isFromCart ? null : 
        <TouchableOpacity
          onPress={() => dispatch(actionLogin())}   // 👈 Change "Home" to your main screen route
          style={styles.skipButton}
        >
          <Text style={styles.skipText}>Skip Login</Text>
        </TouchableOpacity>
        }
      </View>
      {/* Modal and Loader (unchanged) */}
      <CustomModal
        visible={modalVisible}
        title={modalContent.title}
        message={modalContent.message}
        onConfirm={() => setModalVisible(false)}
        confirmText="OK"
        cancelText={null}
      />
      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#FE4A31" />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topSection: {
    backgroundColor: '#E7432D',
    height: responsiveHeight(20), // adjust as needed
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  logoCircle: {
    position: 'absolute',
    top: responsiveHeight(10), // or your value
    alignSelf: 'center',
    width: 150,
    height: 150,
    borderRadius: 55,
    backgroundColor: 'transparent', // or keep as '#fff' if you want a white background
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0, // remove border
    zIndex: 10,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 55, // half of logoCircle's width/height
  },
  cardSection: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: responsiveHeight(-1), // push down to make room for logo
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: responsiveWidth(7),
    paddingTop: responsiveHeight(14), // add extra padding for logo
    paddingBottom: responsiveHeight(2),
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  signInTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 15,
    color: '#3D3D3D',
    marginBottom: 18,
    textAlign: 'left',
    fontWeight: '400',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#222',
    textAlign: 'left',
  },
  input: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    color: '#000',
    backgroundColor: '#fff',
    fontSize: 16,
    marginBottom: 18,
  },
  loginButton: {
    backgroundColor: '#E7432D',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  loginText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  loaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  skipButton: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E7432D',
    width: '100%',
  },
  skipText: {
    color: '#E7432D',
    fontSize: 16,
    fontWeight: '600',
  },

});
