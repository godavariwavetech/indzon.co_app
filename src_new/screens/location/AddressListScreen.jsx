import {appTheme} from '../../config/appTheme';
import {Text} from '../../components/Typography';
import React, {useCallback, useState} from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useDispatch, useSelector} from 'react-redux';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import locationService from '../../services/locationService';
import {setDeliveryAddress} from '../../redux/reducers/auth';
import {updateUserAddress} from '../../redux/reducers/daddy';
import {setSelectedAddress} from '../../redux/reducers/addressSlice';
import {STATIC_APP_FLOW} from '../../config/appMode';
import {persistorStore, staticPersistor} from '../../redux/store';
import {AddressListSkeleton} from '../../components/main/Skeleton';
import ConfirmDialog from '../../components/main/ConfirmDialog';

export default function AddressListScreen({navigation}) {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const {customerId, deliveryAddress} = useSelector(state => state.Auth);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
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
  // An address picked automatically at login is not stored on the server; keep it in the list.
  const listed =
    deliveryAddress?.storage === 'derived' &&
    !records.some(record => record.id === deliveryAddress.id)
      ? [deliveryAddress, ...records]
      : records;
  const refresh = async () => {
    setRefreshing(true);
    try {
      setRecords(await locationService.getSavedAddresses(customerId));
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  };
  const select = async address => {
    dispatch(setDeliveryAddress(address));
    dispatch(updateUserAddress(address));
    dispatch(setSelectedAddress(address));
    await (STATIC_APP_FLOW ? staticPersistor : persistorStore).flush();
    navigation.goBack();
  };
  const remove = address => setPendingDelete(address);
  const confirmRemove = async () => {
    const address = pendingDelete;
    setPendingDelete(null);
    if (!address) {
      return;
    }
    try {
      await locationService.deleteSavedAddress(customerId, address.id);
      const remaining = await locationService.getSavedAddresses(customerId);
      setRecords(remaining);
      if (deliveryAddress?.id === address.id) {
        const next = remaining[0] || null;
        dispatch(setDeliveryAddress(next));
        dispatch(updateUserAddress(next));
        dispatch(setSelectedAddress(next));
        await (STATIC_APP_FLOW ? staticPersistor : persistorStore).flush();
      }
    } catch (err) {
      setError(err.message);
    }
  };
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
          Address
        </Text>
        <Pressable
          style={styles.addNew}
          onPress={() => navigation.navigate('AddAddress')}
          accessibilityRole="button"
          accessibilityLabel="Add new address">
          <MaterialIcons name="add" size={23} color={appTheme.primary /* Original: "#3832FF" */} />
          <Text style={styles.addLabel}>Add New</Text>
        </Pressable>
      </View>
      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
      {loading ? (
        <AddressListSkeleton />
      ) : (
        <FlatList
          data={listed}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} />
          }
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>
              No saved addresses yet. Tap Add New to add your delivery address.
            </Text>
          }
          renderItem={({item}) => (
            <View
              style={[
                styles.card,
                deliveryAddress?.id === item.id && styles.defaultCard,
              ]}>
              <Pressable
                style={styles.address}
                onPress={() => select(item)}
                onLongPress={() =>
                  navigation.navigate('AddAddress', {address: item})
                }
                accessibilityHint="Hold to edit this address"
                accessibilityRole="button"
                accessibilityLabel={`Use ${item.address_type} address`}>
                <View
                  style={[
                    styles.addressIcon,
                    {
                      backgroundColor:
                        item.address_type === 'Home'
                          ? appTheme.tintStrong /* Original: '#E4E1FF' */
                          : /work|office/i.test(item.address_type)
                          ? '#FFF1E5'
                          : '#E2FBEB',
                    },
                  ]}>
                  <MaterialIcons
                    name={
                      item.address_type === 'Home'
                        ? 'home'
                        : /work|office/i.test(item.address_type)
                        ? 'business'
                        : 'location-on'
                    }
                    size={30}
                    color={
                      item.address_type === 'Home'
                        ? appTheme.primary /* Original: '#3832FF' */
                        : /work|office/i.test(item.address_type)
                        ? '#FF7915'
                        : '#00A541'
                    }
                  />
                </View>
                <View style={{flex: 1}}>
                  <View style={styles.cardTitle}>
                    <Text style={styles.type}>{item.address_type}</Text>
                    {deliveryAddress?.id === item.id ? (
                      <Text style={styles.defaultBadge}>Default</Text>
                    ) : null}
                  </View>
                  <Text style={styles.contact}>
                    {item.customer_name}, +91 {item.customer_mobile_number}
                  </Text>
                  <Text style={styles.description}>{item.full_address}</Text>
                </View>
              </Pressable>
              <View style={styles.actions}>
                <Pressable
                  style={styles.deleteAction}
                  onPress={() => remove(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${item.address_type} address`}>
                  <MaterialIcons
                    name="delete-outline"
                    size={20}
                    color="#FF0000"
                  />
                  <Text style={styles.deleteLabel}>Delete</Text>
                </Pressable>
                <Pressable
                  style={styles.useAction}
                  onPress={() => select(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Use ${item.address_type} address`}>
                  <MaterialIcons
                    name="arrow-forward"
                    size={20}
                    color={appTheme.primary /* Original: "#3832FF" */}
                  />
                  <Text style={styles.useLabel}>Use This Address</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
      <ConfirmDialog
        visible={Boolean(pendingDelete)}
        title="Delete this address?"
        message="This removes the saved address from this device."
        confirmLabel="Delete"
        danger
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmRemove}
      />
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
  title: {fontSize: 20, fontWeight: '700', color: '#202427', flex: 1},
  addNew: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: appTheme.primary /* Original: '#3832FF' */,
    backgroundColor: appTheme.surface /* Original: '#F4F2FF' */,
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  addLabel: {fontSize: 13, fontWeight: '700', color: appTheme.primary /* Original: '#3832FF' */},
  list: {padding: 16, gap: 20, paddingBottom: 28},
  card: {
    borderWidth: 1,
    borderColor: '#F0F0F3',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: {width: 0, height: 2},
  },
  defaultCard: {backgroundColor: appTheme.cream /* Original: '#F7F6FF' */},
  address: {flexDirection: 'row', gap: 12, padding: 12},
  addressIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  cardTitle: {flexDirection: 'row', alignItems: 'center', gap: 8},
  type: {fontSize: 17, fontWeight: '700', color: '#202427'},
  defaultBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    backgroundColor: appTheme.primary /* Original: '#3832FF' */,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  description: {fontSize: 14, lineHeight: 21, color: '#48535D', marginTop: 6},
  contact: {fontSize: 15, fontWeight: '600', color: '#202427', marginTop: 9},
  actions: {flexDirection: 'row', borderTopWidth: 1, borderColor: '#E7E7ED'},
  deleteAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 12,
  },
  useAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 12,
    borderLeftWidth: 1,
    borderColor: '#E7E7ED',
  },
  deleteLabel: {fontSize: 13, fontWeight: '700', color: '#FF0000'},
  useLabel: {fontSize: 13, fontWeight: '700', color: appTheme.primary /* Original: '#3832FF' */},
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
