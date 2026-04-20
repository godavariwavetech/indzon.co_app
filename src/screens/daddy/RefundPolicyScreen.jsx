import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import commonStyles from '../../commonstyles/CommonStyles';

const RefundPolicyScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <FontAwesome6 name="arrow-left-long" size={20} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Refund Policy</Text>
      </View>
      <ScrollView style={{padding: 20}}>
        <Text style={styles.effectiveDate}>Effective Date: 20/05/2025</Text>
        
        <Text style={styles.sectionTitle}>1. Order Cancellation</Text>
        <Text style={styles.content}>
          • Orders can only be canceled before the restaurant starts preparing your food{"\n"}
          • Check order status in the app for cancellation availability{"\n"}
          • Food Trail reserves the right to cancel orders in special cases (full refund issued)
        </Text>

        <View style={styles.separator} />

        <Text style={styles.sectionTitle}>2. Refund Policy</Text>
        <Text style={styles.content}>
          <Text style={styles.subsectionTitle}>Canceled Orders:</Text> Full refund if canceled before preparation{"\n"}
          <Text style={styles.subsectionTitle}>Delayed/Undelivered:</Text> Full/partial refund eligible{"\n"}
          <Text style={styles.subsectionTitle}>Quality Issues:</Text> Refund within 24 hours with photo proof{"\n"}
          <Text style={styles.subsectionTitle}>Payment Issues:</Text> Refund in 5–7 business days
        </Text>

        <View style={styles.separator} />

        <Text style={styles.sectionTitle}>3. How to Request a Refund</Text>
        <Text style={styles.content}>
          1. Go to Orders → Select Order → Help & Support → Request Refund{"\n"}
          2. Provide details and supporting images{"\n"}
          3. Credited Time: The refunded amount will  be credited in the original mode payment with in 5-7 working days
        </Text>

        <View style={styles.separator} />

        <Text style={styles.sectionTitle}>4. Non-Refundable Cases</Text>
        <Text style={styles.content}>
          • Change of mind after ordering{"\n"}
          • Food taste preferences{"\n"}
          • Incorrect address provided{"\n"}
          • Late cancellations (after preparation starts)
        </Text>

        <View style={styles.separator} />

        <Text style={styles.sectionTitle}>5. Contact Us</Text>
        <Text style={[styles.content,{marginBottom:responsiveHeight(10)}]}>
          For refund-related queries:{"\n"}
          <TouchableOpacity onPress={() => Linking.openURL('mailto:foodtrailpro@gmail.com')}>
            <Text style={[styles.link, styles.bold]}>Email: foodtrailpro@gmail.com</Text>
          </TouchableOpacity>{"\n"}
          <TouchableOpacity onPress={() => Linking.openURL('tel:8688104157')}>
            <Text style={[styles.link, styles.bold]}>Phone: 8688104157</Text>
          </TouchableOpacity>{"\n"}
          <Text style={[styles.link, styles.bold]}>Address: Tadepalligudem, 534101.</Text>
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingBottom:20
  },
  header: { 
    backgroundColor: commonStyles.yellowColor,
    height: responsiveHeight(15),
    flexDirection: "row",
    alignItems: "flex-end",
    paddingBottom: responsiveHeight(3),
    paddingLeft: responsiveWidth(5),
    gap:6
  },
  backButton: {
    width: responsiveWidth(7)
  },
  title: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#000',
    textAlign: "left" 
  },
  effectiveDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    fontStyle: 'italic'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 15,
    color: commonStyles.appMainColor
  },
  subsectionTitle: {
    fontWeight: '600',
    color: '#333'
  },
  content: {
    fontSize: 14,
    marginTop: 5,
    lineHeight: 24,
    color: '#666'
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 15
  },
  bold: {
    fontWeight: '700',
    color: '#000'
  },
  link: {
    color: '#065E2C',
    textDecorationLine: 'underline',
  }
});

export default RefundPolicyScreen; 