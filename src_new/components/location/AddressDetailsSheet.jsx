import React, {useEffect, useRef, useState} from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LocationButton from './LocationButton';
import {validateAddress} from '../../services/locationService';
import {sanitizePhoneNumber} from '../../utils/phone';

const types = [
  {label: 'Home', icon: 'home'},
  {label: 'Office', icon: 'business'},
  {label: 'Others', icon: 'storefront'},
];

export default function AddressDetailsSheet({
  visible,
  place,
  phoneNumber,
  existingAddress,
  onClose,
  onSave,
}) {
  const insets = useSafeAreaInsets();
  const [fields, setFields] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  useEffect(() => {
    if (!visible) {
      return;
    }
    const type = existingAddress?.address_type || 'Home';
    setFields({
      type: ['Home', 'Office'].includes(type) ? type : 'Others',
      customType: ['Home', 'Office'].includes(type) ? '' : type,
      name: existingAddress?.customer_name || '',
      contact: existingAddress?.customer_mobile_number || phoneNumber || '',
      doorNo: existingAddress?.door_no || existingAddress?.full_address || '',
      pincode: existingAddress?.pincode || place?.pincode || '',
      landmark: existingAddress?.landmark || '',
    });
    setError('');
  }, [visible, existingAddress, phoneNumber, place?.pincode]);
  const change = (key, value) => {
    setFields(current => ({...current, [key]: value}));
    setError('');
  };
  const save = async () => {
    if (busy.current) {
      return;
    }
    const validationError = validateAddress(fields, place);
    if (validationError) {
      setError(validationError);
      return;
    }
    busy.current = true;
    setSaving(true);
    setError('');
    try {
      await onSave(fields);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Could not save your address. Please try again.',
      );
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };
  const inputs = [
    {
      key: 'name',
      label: 'Name',
      placeholder: 'Enter your name',
      autoComplete: 'name',
    },
    {
      key: 'contact',
      label: 'Contact number',
      placeholder: 'Enter contact number',
      keyboardType: 'phone-pad',
      autoComplete: 'tel',
    },
    {
      key: 'doorNo',
      label: 'Door no/Flat no/ Building',
      placeholder: 'Door, flat or building number',
    },
    {
      key: 'pincode',
      label: 'Pin number',
      placeholder: 'Enter pin number',
      keyboardType: 'number-pad',
      maxLength: 6,
    },
    {
      key: 'landmark',
      label: 'Near by Landmark',
      placeholder: 'Nearby landmark (optional)',
    },
  ];
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => !saving && onClose()}
      statusBarTranslucent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable
          style={styles.backdrop}
          onPress={() => !saving && onClose()}
          accessibilityLabel="Close address details"
          accessibilityRole="button"
        />
        <View
          style={[styles.sheet, {paddingBottom: Math.max(insets.bottom, 16)}]}>
          <View style={styles.heading}>
            <MaterialIcons name="location-on" color="#0096A1" size={28} />
            <View style={styles.addressCopy}>
              <Text style={styles.area}>{place?.area}</Text>
              <Text style={styles.address} numberOfLines={2}>
                {place?.fullAddress}
              </Text>
            </View>
            <Pressable
              disabled={saving}
              onPress={onClose}
              hitSlop={10}
              accessibilityLabel="Close"
              accessibilityRole="button">
              <MaterialIcons name="close" color="#A7A7A7" size={26} />
            </Pressable>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.form}>
            <View style={styles.types}>
              {types.map(type => (
                <Pressable
                  key={type.label}
                  disabled={saving}
                  onPress={() => change('type', type.label)}
                  accessibilityRole="radio"
                  accessibilityLabel={type.label}
                  accessibilityState={{selected: fields.type === type.label}}
                  style={[
                    styles.type,
                    fields.type === type.label && styles.selectedType,
                  ]}
                  testID={`address-type-${type.label}`}>
                  <MaterialIcons
                    name={type.icon}
                    size={22}
                    color={fields.type === type.label ? '#0096A1' : '#48535D'}
                  />
                  <Text
                    style={[
                      styles.typeText,
                      fields.type === type.label && styles.selectedTypeText,
                    ]}>
                    {type.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            {fields.type === 'Others' ? (
              <TextInput
                value={fields.customType}
                onChangeText={value => change('customType', value)}
                editable={!saving}
                placeholder="Address label"
                placeholderTextColor="#858585"
                style={styles.customType}
                accessibilityLabel="Address label"
                testID="address-custom-type"
              />
            ) : null}
            {inputs.map(input => (
              <View key={input.key} style={styles.field}>
                <Text style={styles.label}>{input.label}</Text>
                <View style={styles.inputRow}>
                  {input.key === 'contact' ? (
                    <Text style={styles.prefix}>+91</Text>
                  ) : null}
                  <TextInput
                    value={fields[input.key] || ''}
                    editable={!saving}
                    onChangeText={value =>
                      change(
                        input.key,
                        input.key === 'contact'
                          ? sanitizePhoneNumber(value)
                          : input.key === 'pincode'
                          ? value.replace(/\D/g, '').slice(0, 6)
                          : value,
                      )
                    }
                    placeholder={input.placeholder}
                    placeholderTextColor="#858585"
                    keyboardType={input.keyboardType || 'default'}
                    autoComplete={input.autoComplete}
                    maxLength={input.maxLength}
                    style={styles.input}
                    accessibilityLabel={input.label}
                    testID={`address-${input.key}`}
                  />
                  {fields[input.key] ? (
                    <Pressable
                      disabled={saving}
                      onPress={() => change(input.key, '')}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={`Clear ${input.label}`}>
                      <MaterialIcons name="close" size={19} color="#48535D" />
                    </Pressable>
                  ) : null}
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={styles.save}>
            {error ? (
              <Text
                style={styles.error}
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
                testID="address-save-error">
                {error}
              </Text>
            ) : null}
            <LocationButton
              label="Save Address"
              onPress={save}
              loading={saving}
              testID="address-save"
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000040'},
  backdrop: {...StyleSheet.absoluteFillObject},
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingTop: 16,
  },
  heading: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
    alignItems: 'flex-start',
  },
  addressCopy: {flex: 1},
  area: {fontSize: 19, lineHeight: 25, fontWeight: '700', color: '#151515'},
  address: {fontSize: 13, lineHeight: 19, color: '#484848', marginTop: 3},
  form: {paddingHorizontal: 16, paddingBottom: 4},
  types: {flexDirection: 'row', gap: 4, marginVertical: 10},
  type: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: '#808080',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 7,
  },
  selectedType: {borderColor: '#0096A1'},
  typeText: {fontSize: 15, color: '#48535D', fontWeight: '600'},
  selectedTypeText: {color: '#0096A1'},
  customType: {
    borderBottomWidth: 1,
    borderColor: '#808080',
    padding: 8,
    color: '#202427',
  },
  field: {marginTop: 12},
  label: {fontSize: 13, lineHeight: 18, color: '#202427', marginBottom: 4},
  inputRow: {
    minHeight: 49,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#909090',
    borderRadius: 8,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    minHeight: 47,
    fontSize: 16,
    color: '#151515',
    paddingVertical: 10,
  },
  prefix: {fontSize: 16, color: '#151515', paddingRight: 4},
  error: {color: '#C62828', fontSize: 13, lineHeight: 18},
  save: {paddingHorizontal: 16, paddingTop: 12, gap: 12},
});
