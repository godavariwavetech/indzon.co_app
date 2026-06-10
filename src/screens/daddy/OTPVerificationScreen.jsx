import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {verifyOTP, checkAddressExistence} from '../../redux/reducers/daddy';
import Geolocation from 'react-native-geolocation-service';

export default function OTPVerificationScreen({navigation}) {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const {message} = useSelector(state => state.Dashboard);

  const handleVerifyOTP = async () => {
    if (otp.length !== 4) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await dispatch(verifyOTP({otp})).unwrap();
      
      if (result) {
        // Get current location
        Geolocation.getCurrentPosition(
          async position => {
            const {latitude, longitude} = position.coords;
            
            // Check service availability
            const serviceResult = await dispatch(
              checkAddressExistence({
                latitude: latitude.toString(),
                longitude: longitude.toString(),
              })
            ).unwrap();

            if (serviceResult?.data?.service_available) {
              // Service is available, navigate to home
              navigation.replace('UserHome');
            } else {
              // Service not available, show locations screen
              navigation.replace('ServiceLocations');
            }
          },
          error => {
            console.error('Error getting location:', error);
            setIsLoading(false);
          },
          {
            enableHighAccuracy: false,
            timeout: 20000,
            maximumAge: 1000,
          }
        );
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify OTP</Text>
      <Text style={styles.subtitle}>
        Please enter the verification code sent to your mobile number
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Enter 6-digit OTP"
        keyboardType="number-pad"
        maxLength={6}
        value={otp}
        onChangeText={setOtp}
      />

      {message && <Text style={styles.errorText}>{message}</Text>}

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleVerifyOTP}
        disabled={isLoading || otp.length !== 6}>
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Verify OTP</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#065E2C',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#065E2C',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
  },
}); 