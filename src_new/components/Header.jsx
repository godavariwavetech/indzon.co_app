import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const Header = ({ title, onBackPress }) => (
  <View style={styles.header}>
    <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
      <Icon name="chevron-left" size={24} color="#333" />
    </TouchableOpacity>
    <Text style={styles.title}>{title}</Text>
  </View>
);

const styles = {
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingVertical: 10,
  },
  backButton: {
    marginRight: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    flexGrow: 1,
  },
};

export default Header;