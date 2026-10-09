import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Image,
  BackHandler,
} from 'react-native';
import {
  responsiveHeight,
  responsiveWidth,
} from 'react-native-responsive-dimensions';
import { useDispatch, useSelector } from 'react-redux';
import { clearCart } from '../../redux/reducers/daddy';
import { removeCoupon } from '../../redux/reducers/coupons';
import commonStyles from '../../commonstyles/CommonStyles';
import { getOrderId } from '../../utils/orderResponse';

const OrderSuccessScreen = ({ navigation, route }) => {
  const {selectedAddress} = useSelector(state => state.address);
  const dispatch = useDispatch();

  useEffect(()=>{ 
    const timeout = setTimeout(()=>{
      handleBackPress()
      dispatch(clearCart())
      dispatch(removeCoupon())
    },3000)
    return () => clearTimeout(timeout);
  },[])

  const handleBackPress = () => {
    if (!getOrderId(route?.params?.response)) {
      navigation.reset({ index: 0, routes: [{ name: 'BottomNavigation', params: { screen: 'Reorder' } }] });
      return;
    }
    navigation.navigate('OrderDetails',{fromOrderSuccess:true,orderDetails:route?.params?.response});
  };

  useEffect(() => {
    const backAction = () => {
      handleBackPress();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove(); 
  }, []);


  return (
    <View style={styles.container}>
      {/* <StatusBar backgroundColor="transparent" translucent barStyle="dark-content" /> */}
      
      <View style={styles.content}>
        {/* <View style={styles.checkmarkContainer}> */}
            <Image source={require('../daddy/tabassets/orderSuccess.png')}  resizeMode='contain' style={styles.checkmarkImage} />
          {/* <MaterialIcons name="check" size={40} color="#fff" /> */}
        {/* </View> */}
        
        <Text style={styles.successText}>
          Order successfully placed for
        </Text>
        
        <View style={styles.addressContainer}>
          <Text style={styles.addressType}>
            {selectedAddress?.address_type || 'Home'}
          </Text>
          <Text style={styles.addressText}>
            {selectedAddress?.full_address || '301, JSR Enclave, Danvaipetapuram Lorem Ipsum Lorem Dolor Sit'}
          </Text>
        </View>
{/* 
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('Categories')}
        >
          <Text style={styles.buttonText}>Back to Home</Text>
        </TouchableOpacity> */}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: responsiveWidth(5),
  },
  checkmarkContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: commonStyles.yellowColor,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: responsiveHeight(3),
  },
  successText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: responsiveHeight(1),
  },
  addressContainer: {
    alignItems: 'center',
    marginTop: responsiveHeight(1),
  },
  addressType: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: responsiveHeight(1),
  },
  addressText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    width: responsiveWidth(80),
  },
  button: {
    backgroundColor: '#065E2C',
    paddingVertical: responsiveHeight(1.5),
    paddingHorizontal: responsiveWidth(10),
    borderRadius: 8,
    marginTop: responsiveHeight(4),
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  checkmarkImage:{
    width:responsiveWidth(90),
    height:responsiveWidth(50),
    marginBottom:responsiveHeight(1)
  }
});

export default OrderSuccessScreen; 
