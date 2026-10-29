import {appTheme} from '../../config/appTheme';
import {fontSizes, Text} from '../Typography';
import React from 'react';
import {Modal, Pressable, StyleSheet, View} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {colors} from './MainUi';

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  icon,
  hideCancel = false,
  danger = false,
  onConfirm,
  onCancel,
}) {
  const actionColor = danger ? '#D93A48' : colors.primary;
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Close confirmation"
        />
        <View
          style={styles.card}
          accessibilityViewIsModal
          accessibilityLiveRegion="polite">
          <View style={[styles.icon, danger && styles.dangerIcon]}>
            <MaterialIcons
              name={icon || (danger ? 'delete-outline' : 'info-outline')}
              size={24}
              color={actionColor}
            />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            {hideCancel ? null : (
              <Pressable
                onPress={onCancel}
                style={styles.cancelButton}
                accessibilityRole="button">
                <Text style={styles.cancelText}>{cancelLabel}</Text>
              </Pressable>
            )}
            <Pressable
              onPress={onConfirm}
              style={[styles.confirmButton, {backgroundColor: actionColor}]}
              accessibilityRole="button">
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#11152D80',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    padding: 22,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    elevation: 12,
    shadowColor: appTheme.ink /* Original: '#161838' */,
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: {width: 0, height: 8},
  },
  icon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: appTheme.tint /* Original: '#F0EFFF' */,
    marginBottom: 12,
  },
  dangerIcon: {backgroundColor: '#FFF0F1'},
  title: {
    fontSize: fontSizes.sectionTitle,
    lineHeight: 27,
    fontWeight: '700',
    color: '#202427',
    textAlign: 'center',
  },
  message: {
    fontSize: fontSizes.body,
    lineHeight: 21,
    color: '#667180',
    textAlign: 'center',
    marginTop: 7,
  },
  actions: {width: '100%', flexDirection: 'row', gap: 10, marginTop: 22},
  cancelButton: {
    flex: 1,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E5ED',
    borderRadius: 11,
  },
  confirmButton: {
    flex: 1,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  cancelText: {fontSize: fontSizes.body, fontWeight: '600', color: '#505968'},
  confirmText: {fontSize: fontSizes.body, fontWeight: '700', color: '#FFFFFF'},
});
