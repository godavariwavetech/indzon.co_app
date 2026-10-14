import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { responsiveWidth, responsiveHeight } from 'react-native-responsive-dimensions';

const CustomAlert = ({ 
  visible,
  title,
  message,
  confirmText = "OK",
  onConfirm,
  showCancel = false,
  cancelText = "Cancel",
  onCancel
}) => {
  return (
    <Modal isVisible={visible} transparent>
      <View style={{flex:1,alignItems:"center",justifyContent:"center",backgroundColor:"rgba(0, 0, 0, 0.5)"}}>
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        
        <View style={styles.buttonContainer}>
          {showCancel && (
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={styles.cancelText}>{cancelText}</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.button, styles.confirmButton]}
            onPress={onConfirm}
          >
            <Text style={styles.confirmText}>{confirmText}</Text>
          </TouchableOpacity>
        </View>
      </View>
      </View>        

    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    marginHorizontal: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    alignItems:"center",
    justifyContent:"center"
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#065E2C',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#444',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    width: '48%',
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
    marginRight: 10
  },
  confirmButton: {
    backgroundColor: '#065E2C',
    width: '100%',
  },
  cancelText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600'
  },
  confirmText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign:"center"
  }
});

export default CustomAlert; 