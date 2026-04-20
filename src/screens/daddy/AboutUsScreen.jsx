import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import commonStyles from '../../commonstyles/CommonStyles';

const AboutUsScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <FontAwesome6 name="arrow-left-long" size={20} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>About Us</Text>
      </View>
      <ScrollView style={{padding: 20}}>
        <Text style={styles.content}>
          Welcome to Food Trail, your ultimate food delivery companion! We are committed to bringing the best meals from your favorite local restaurants straight to your doorstep.
        </Text>

        <Text style={styles.sectionTitle}>Why Choose Food Trail?</Text>
        
        <View style={styles.featureItem}>
          <MaterialCommunityIcons name="check-circle" size={20} color={commonStyles.appMainColor} />
          <Text style={styles.featureText}>Wide Variety of Categories – Explore diverse cuisines from street food to fine dining</Text>
        </View>

        <View style={styles.featureItem}>
          <MaterialCommunityIcons name="check-circle" size={20} color={commonStyles.appMainColor} />
          <Text style={styles.featureText}>Restaurant Ratings & Reviews – Make informed decisions with honest feedback</Text>
        </View>

        <View style={styles.featureItem}>
          <MaterialCommunityIcons name="check-circle" size={20} color={commonStyles.appMainColor} />
          <Text style={styles.featureText}>Seamless Cart & Checkout – Intuitive ordering experience</Text>
        </View>

        <View style={styles.featureItem}>
          <MaterialCommunityIcons name="check-circle" size={20} color={commonStyles.appMainColor} />
          <Text style={styles.featureText}>Fast & Reliable Delivery – Food arrives hot and fresh</Text>
        </View>

        <View style={styles.featureItem}>
          <MaterialCommunityIcons name="check-circle" size={20} color={commonStyles.appMainColor} />
          <Text style={styles.featureText}>Secure Payments – Multiple safe payment options</Text>
        </View>

        <View style={styles.featureItem}>
          <MaterialCommunityIcons name="check-circle" size={20} color={commonStyles.appMainColor} />
          <Text style={styles.featureText}>Real-Time Order Tracking – Follow your order from restaurant to doorstep</Text>
        </View>

        <Text style={[styles.content, {marginTop: 20}]}>
          At Food Trail, we believe food is more than just a meal – it's an experience. Join us in revolutionizing food delivery, where great food is always within reach!
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 15,
    color: commonStyles.appMainColor
  },
  content: {
    fontSize: 14,
    lineHeight: 24,
    color: '#666',
    marginBottom: 15
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: '#444',
    lineHeight: 20
  }
});

export default AboutUsScreen; 