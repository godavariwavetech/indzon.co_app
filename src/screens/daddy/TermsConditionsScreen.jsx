import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import commonStyles from '../../commonstyles/CommonStyles';
import { colors } from '../../config/theme';

const TermsConditionsScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <FontAwesome6 name="arrow-left-long" size={20} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Terms and Conditions</Text>
      </View>
      <ScrollView style={{padding: 20}}>
        <Text style={styles.effectiveDate}>Last Updated: 20/05/2025</Text>
        <Text style={styles.content}>
          Welcome to Amaraa! These Terms and Conditions govern your use of our platform, including our website and mobile application. By accessing or using Amaraa, you agree to comply with these Terms. If you do not agree, please refrain from using our services.
        </Text>

        <View style={styles.separator} />

        <Text style={styles.sectionTitle}>1. Definitions</Text>
        <Text style={styles.content}>
          <Text style={styles.subsectionTitle}>• "Amaraa"</Text> refers to our food delivery platform, including the mobile application and website.{"\n"}
          <Text style={styles.subsectionTitle}>• "User"</Text> refers to any individual who accesses or uses Amaraa.{"\n"}
          <Text style={styles.subsectionTitle}>• "Restaurant Partner"</Text> refers to the restaurants listed on our platform.{"\n"}
          <Text style={styles.subsectionTitle}>• "Delivery Partner"</Text> refers to the individuals responsible for delivering orders.
        </Text>

        <View style={styles.separator} />

        <Text style={styles.sectionTitle}>2. Eligibility</Text>
        <Text style={styles.content}>
          You must be at least 18 years old to use Amaraa. By accessing our platform, you represent that you meet this requirement.
        </Text>

        <View style={styles.separator} />

        <Text style={styles.sectionTitle}>3. Use of Services</Text>
        <Text style={styles.content}>
          • You agree to use Amaraa for lawful purposes only.{"\n"}
          • You shall not engage in fraudulent activities, abuse promotions, or interfere with the platform's functionality.{"\n"}
          • We reserve the right to suspend or terminate your account if we detect suspicious activity.
        </Text>

        <View style={styles.separator} />

        <Text style={styles.sectionTitle}>4. Orders and Payments</Text>
        <Text style={styles.content}>
          • Orders placed through Amaraa are subject to restaurant availability.{"\n"}
          • Prices listed on the platform may change at any time.{"\n"}
          • Payments must be made through the available payment methods. Amaraa is not responsible for payment failures due to banking issues.{"\n"}
          • Orders cannot be canceled once confirmed, unless explicitly allowed by the restaurant.
        </Text>

        <View style={styles.separator} />

        <Text style={styles.sectionTitle}>5. Delivery Policy</Text>
        <Text style={styles.content}>
          • Estimated delivery times are approximate and may vary due to factors such as traffic, weather, or restaurant preparation time.{"\n"}
          • If an order cannot be delivered due to incorrect address details, the user may still be charged.{"\n"}
          • Amaraa is not liable for delays caused by third-party service providers.
        </Text>

        <View style={styles.separator} />

        <Text style={styles.sectionTitle}>6. Shipping Policy</Text>
        <Text style={styles.content}>
          • All ordered food will be delivered within 1 hour of order confirmation{"\n"}
          • Delivery time may vary based on restaurant preparation time and distance{"\n"}
          • Real-time order tracking is available in the app{"\n"}
          • Contact support if delivery exceeds the estimated time{"\n"}
          • Delivery areas are subject to restaurant availability{"\n"}
          • Minimum order value may apply for delivery
        </Text>

        <View style={styles.separator} />

        <Text style={styles.sectionTitle}>7. Refund and Cancellation Policy</Text>
        <Text style={styles.content}>
          • Refunds will be processed only in cases where an order is undelivered, incomplete, or incorrect.{"\n"}
          • Any refund request must be made within 24 hours of order delivery.{"\n"}
          • The final decision on refunds rests with Amaraa.
        </Text>

        <View style={styles.separator} />

        <Text style={styles.sectionTitle}>8. User Conduct</Text>
        <Text style={styles.content}>
          • Users must not misuse, hack, or attempt to exploit vulnerabilities in the platform.{"\n"}
          • Abusive language, harassment, or inappropriate behavior towards restaurant or delivery partners will not be tolerated.
        </Text>

        <View style={styles.separator} />

        <Text style={styles.sectionTitle}>9. Intellectual Property</Text>
        <Text style={styles.content}>
          • All content on Amaraa, including logos, trademarks, and text, is the property of Amaraa and protected by copyright laws.{"\n"}
          • You may not use our content without prior written consent.
        </Text>

        <View style={styles.separator} />

        <Text style={styles.sectionTitle}>10. Limitation of Liability</Text>
        <Text style={styles.content}>
          • Amaraa is not responsible for food quality, preparation, or hygiene standards of restaurant partners.{"\n"}
          • We are not liable for any direct, indirect, or incidental damages arising from the use of our services.
        </Text>

        <View style={styles.separator} />

        <Text style={styles.sectionTitle}>11. Privacy Policy</Text>
        <Text style={styles.content}>
          Your use of Amaraa is also governed by our Privacy Policy. By using our platform, you consent to the collection and processing of your data as outlined in the policy.
        </Text>

        <View style={styles.separator} />

        <Text style={styles.sectionTitle}>12. Modifications to Terms</Text>
        <Text style={styles.content}>
          We reserve the right to update these Terms at any time. Continued use of Amaraa after modifications constitutes acceptance of the updated Terms.
        </Text>

        <View style={styles.separator} />

        <Text style={styles.sectionTitle}>13. Governing Law</Text>
        <Text style={styles.content}>
          These Terms shall be governed by and interpreted in accordance with the laws of India.
        </Text>

        <View style={styles.separator} />

        <Text style={styles.sectionTitle}>14. Contact Us</Text>
        <Text style={[styles.content,{marginBottom:responsiveHeight(10)}]}>
          For any queries or concerns regarding these Terms:{"\n"}
          <TouchableOpacity onPress={() => Linking.openURL('mailto:amaraasupport@gmail.com')}>
            <Text style={[styles.link, styles.bold]}>Email: amaraasupport@gmail.com</Text>
          </TouchableOpacity>{"\n"}
          <TouchableOpacity onPress={() => Linking.openURL('tel:8688104157')}>
            <Text style={[styles.link, styles.bold]}>Phone: 86881 04157</Text>
          </TouchableOpacity>{"\n"}
          {/* <Text style={[styles.link, styles.bold]}>Address: Tadepalligudem, 534101.</Text> */}
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingBottom:20
  },
  header: { 
    backgroundColor: '#85360B',
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
    color: '#fff',
    textAlign: "left" 
  },
  effectiveDate: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 15,
    fontStyle: 'italic'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 15,
    color: colors.green
  },
  subsectionTitle: {
    fontWeight: '600',
    color: colors.darkGray
  },
  content: {
    fontSize: 14,
    marginTop: 5,
    lineHeight: 24,
    color: colors.gray
  },
  separator: {
    height: 1,
    backgroundColor: colors.borderGray,
    marginVertical: 15
  },
  bold: {
    fontWeight: '700',
    color: colors.black
  },
  link: {
    color: colors.green,
    textDecorationLine: 'underline',
  }
});

export default TermsConditionsScreen;