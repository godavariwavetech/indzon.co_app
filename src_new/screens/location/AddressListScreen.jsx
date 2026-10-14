import React, {useCallback, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useDispatch, useSelector} from 'react-redux';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import locationService from '../../services/locationService';
import LocationButton from '../../components/location/LocationButton';
import {setDeliveryAddress} from '../../redux/reducers/auth';
import {updateUserAddress} from '../../redux/reducers/daddy';
import {setSelectedAddress} from '../../redux/reducers/addressSlice';

export default function AddressListScreen({navigation, route}) {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const {customerId, deliveryAddress} = useSelector(state => state.Auth);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      setError('');
      locationService
        .getSavedAddresses(customerId)
        .then(
          addresses => {
            if (active) {
              setRecords(addresses);
            }
          },
          err => {
            if (active) {
              setError(err.message);
            }
          },
        )
        .finally(() => {
          if (active) {
            setLoading(false);
          }
        });
      return () => {
        active = false;
      };
    }, [customerId]),
  );
  const select = address => {
    dispatch(setDeliveryAddress(address));
    dispatch(updateUserAddress(address));
    dispatch(setSelectedAddress(address));
    navigation.goBack();
  };
  const remove = address =>
    Alert.alert(
      'Delete address?',
      'This removes the saved address from this device.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await locationService.deleteSavedAddress(customerId, address.id);
              const remaining = await locationService.getSavedAddresses(
                customerId,
              );
              setRecords(remaining);
              if (deliveryAddress?.id === address.id) {
                const next = remaining[0] || null;
                dispatch(setDeliveryAddress(next));
                dispatch(updateUserAddress(next));
                dispatch(setSelectedAddress(next));
                if (!next) {
                  const root = navigation.getParent?.() || navigation;
                  root.reset({index: 0, routes: [{name: 'LocationSetup'}]});
                }
              }
            } catch (err) {
              setError(err.message);
            }
          },
        },
      ],
    );
  return (
    <View
      style={[
        styles.screen,
        {
          paddingTop: insets.top + 8,
          paddingBottom: Math.max(insets.bottom, 16),
        },
      ]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={10}>
          <MaterialIcons name="arrow-back" size={26} color="#202427" />
        </Pressable>
        <Text style={styles.title} accessibilityRole="header">
          Saved addresses
        </Text>
      </View>
      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
      {route?.params?.isFromCart ? (
        <Text style={styles.notice}>
          These addresses are saved on your device. Delivery availability has
          not been checked yet.
        </Text>
      ) : null}
      {loading ? (
        <ActivityIndicator style={styles.loading} color="#3832FF" />
      ) : (
        <FlatList
          data={records}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>
              No saved addresses yet. Add your delivery address below.
            </Text>
          }
          renderItem={({item}) => (
            <View style={styles.card}>
              <Pressable
                style={styles.address}
                onPress={() => select(item)}
                accessibilityRole="button"
                accessibilityLabel={`Use ${item.address_type} address`}>
                <View style={styles.cardTitle}>
                  <Text style={styles.type}>{item.address_type}</Text>
                  {deliveryAddress?.id === item.id ? (
                    <MaterialIcons
                      name="check-circle"
                      size={20}
                      color="#3832FF"
                    />
                  ) : null}
                </View>
                <Text style={styles.description}>{item.full_address}</Text>
                <Text style={styles.contact}>
                  {item.customer_name} · +91 {item.customer_mobile_number}
                </Text>
              </Pressable>
              <View style={styles.actions}>
                <Pressable
                  onPress={() =>
                    navigation.navigate('AddAddress', {address: item})
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${item.address_type} address`}
                  hitSlop={8}>
                  <MaterialIcons name="edit" size={22} color="#48535D" />
                </Pressable>
                <Pressable
                  onPress={() => remove(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${item.address_type} address`}
                  hitSlop={8}>
                  <MaterialIcons
                    name="delete-outline"
                    size={24}
                    color="#48535D"
                  />
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
      <View style={styles.add}>
        <LocationButton
          label="Add New Address"
          onPress={() => navigation.navigate('AddAddress')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#FFFFFF'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {fontSize: 20, fontWeight: '700', color: '#202427'},
  list: {padding: 16, gap: 12},
  card: {
    borderWidth: 1,
    borderColor: '#DFE6F5',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
  },
  address: {flex: 1},
  cardTitle: {flexDirection: 'row', alignItems: 'center', gap: 8},
  type: {fontSize: 17, fontWeight: '700', color: '#202427'},
  description: {fontSize: 14, lineHeight: 21, color: '#48535D', marginTop: 6},
  contact: {fontSize: 12, color: '#6B7280', marginTop: 8},
  actions: {gap: 20, paddingLeft: 4},
  loading: {flex: 1},
  empty: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 40,
  },
  error: {color: '#C62828', fontSize: 13, padding: 16},
  notice: {
    fontSize: 12,
    lineHeight: 18,
    color: '#6B7280',
    paddingHorizontal: 16,
  },
  add: {paddingHorizontal: 16, paddingTop: 10},
});
