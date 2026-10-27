import {Text, TextInput} from '../../components/Typography';
import React, {useState} from 'react';
import {Pressable, RefreshControl, ScrollView, StyleSheet, View} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {money} from '../../config/catalog';
import {useOrders} from '../../services/catalogService';
import {
  colors,
  Heading,
  Page,
  usePageReady,
} from '../../components/main/MainUi';
import {shipmentStatus} from '../../components/main/OrderShipment';
import {OrdersSkeleton} from '../../components/main/Skeleton';
import LinearGradient from 'react-native-linear-gradient';

// Status chip colours: blue while in progress, green when delivered, red when cancelled.
const statusTone = status => {
  const value = String(status || '').toLowerCase();
  if (value === 'delivered') {
    return {background: '#E4F6EC', color: '#12805C'};
  }
  if (value === 'cancelled') {
    return {background: '#FDECEE', color: '#C4323F'};
  }
  if (value === 'out for delivery') {
    return {background: '#FFF2E0', color: '#B25E00'};
  }
  return {background: '#EEF0FF', color: '#3832FF'};
};

export function DeliveryAddress({address, phoneNumber}) {
  const rows = [
    ['person-outline', 'NAME', address?.customer_name || ''],
    [
      'phone',
      'PH NO',
      address?.customer_mobile_number || phoneNumber
        ? `+91${address?.customer_mobile_number || phoneNumber}`
        : '',
    ],
    ['location-on', 'ADDRESS', address?.full_address || ''],
  ];
  return (
    <View style={styles.delivery}>
      <Text style={styles.deliveryTitle}>Delivery Address</Text>
      {rows.map(([icon, label, value]) => (
        <View key={label} style={styles.addressRow}>
          <MaterialIcons name={icon} size={23} color={colors.primary} />
          <View style={{flex: 1}}>
            <Text style={styles.addressLabel}>{label}</Text>
            <Text style={styles.addressValue}>{value}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}
export default function MainOrdersScreen({navigation}) {
  const pageReady = usePageReady();
  const {orders: allOrders, refreshing, refresh, loading} = useOrders();
  const [search, setSearch] = useState('');
  const query = search.trim().toLowerCase().replace(/^#/, '');
  const filteredOrders = allOrders.filter(order => {
    const searchable = [
      String(order.id).replace('preview-', ''),
      ...(order.groups || []).flatMap(group => [
        group.name,
        shipmentStatus(group, order),
      ]),
    ].join(' ').toLowerCase();
    return searchable.includes(query);
  });
  return (
    <Page>
      <Heading title="My Orders" navigation={navigation} />
      <View style={styles.searchBar}>
        <MaterialIcons name="search" size={22} color={colors.primary} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search order ID, category or status"
          placeholderTextColor="#858393"
          accessibilityLabel="Search orders by order ID, category or status"
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          style={styles.searchInput}
        />
        {search.length > 0 && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear order search"
            onPress={() => setSearch('')}
            style={styles.clearSearch}>
            <MaterialIcons name="close" size={19} color="#737B8C" />
          </Pressable>
        )}
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}>
        {loading && !allOrders.length ? <OrdersSkeleton /> : null}
        {filteredOrders.length === 0 && !loading && (
          <View style={styles.emptySearch}>
            <MaterialIcons name="search-off" size={32} color="#8A829D" />
            <Text style={styles.emptyTitle}>No orders found</Text>
            <Text style={styles.emptyCaption}>Try another order ID, category or status.</Text>
          </View>
        )}
        {filteredOrders.map(order => (
          <View
            key={order.id}
            style={[styles.order, pageReady && styles.orderShadow]}>
            <LinearGradient
              colors={['#4B43FF', '#2F3BFF']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={styles.orderHeader}>
              <View style={styles.orderHeaderInner}>
                <View style={{flex: 1, minWidth: 0}}>
                  <Text style={styles.headerLabel}>ORDER ID</Text>
                  <Text style={styles.headerId}>
                    #{order.id.replace('preview-', '')}
                  </Text>
                  <Text style={styles.headerDate}>{order.placed}</Text>
                </View>
                <View style={styles.headerTotal}>
                  <Text style={styles.headerLabel}>TOTAL AMOUNT</Text>
                  <Text style={styles.headerAmount}>{money(order.price)}</Text>
                </View>
              </View>
            </LinearGradient>
            {order.groups.map((group, index) => {
              const status = shipmentStatus(group, order);
              return (
                <View key={group.id || group.name} style={styles.shipmentCard}>
                  <Text style={styles.shipmentNumber}>
                    SHIPMENT {index + 1} OF {order.groups.length}
                  </Text>
                  <View style={styles.shipmentHeading}>
                    <Text style={styles.categoryTitle}>{group.name}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        {backgroundColor: statusTone(status).background},
                      ]}>
                      <Text
                        style={[
                          styles.statusText,
                          {color: statusTone(status).color},
                        ]}>
                        {status}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.shipmentFooter}>
                    <View style={styles.shipmentAmount}>
                      <Text style={styles.productQuantity}>
                        Quantity: {group.count}
                      </Text>
                      <Text style={styles.amount}>{money(group.price)}</Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={'Track ' + group.name + ' shipment'}
                      style={styles.trackAction}
                      onPress={() =>
                        navigation.navigate('OrderDetails', {
                          orderId: order.id,
                          groupName: group.name,
                        })
                      }>
                      <Text style={styles.trackLabel}>Track shipment</Text>
                      <MaterialIcons
                        name="chevron-right"
                        size={20}
                        color={colors.primary}
                      />
                    </Pressable>
                  </View>
                </View>
              );
            })}
            <Pressable
              style={styles.orderFooter}
              accessibilityRole="button"
              accessibilityLabel="View full order and bill"
              onPress={() =>
                navigation.navigate('OrderDetails', {orderId: order.id})
              }>
              <Text style={styles.trackLabel}>View full order</Text>
              <MaterialIcons
                name="chevron-right"
                size={22}
                color={colors.primary}
              />
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </Page>
  );
}
const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingLeft: 12,
    paddingRight: 4,
    minHeight: 46,
    borderWidth: 1,
    borderColor: '#E1E5F0',
    borderRadius: 12,
    backgroundColor: '#F7F8FC',
  },
  searchInput: {flex: 1, minWidth: 0, fontSize: 15, color: '#242637', paddingVertical: 10},
  clearSearch: {minWidth: 40, minHeight: 40, alignItems: 'center', justifyContent: 'center'},
  emptySearch: {alignItems: 'center', paddingVertical: 36, gap: 10},
  emptyTitle: {fontSize: 17, fontWeight: '700', color: '#242637'},
  emptyCaption: {fontSize: 14, color: '#737B8C', textAlign: 'center'},
  orderHeader: {borderRadius: 13, marginBottom: 10, overflow: 'hidden'},
  orderHeaderInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
  },
  headerLabel: {
    fontSize: 9.9,
    fontWeight: '700',
    letterSpacing: 0.7,
    color: '#DBD9FF',
  },
  headerId: {
    fontSize: 14.4,
    lineHeight: 19.8,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 5,
  },
  headerDate: {
    fontSize: 10.8,
    lineHeight: 15.3,
    color: '#E6E4FF',
    marginTop: 5,
  },
  headerTotal: {alignItems: 'flex-end', maxWidth: '42%'},
  headerAmount: {
    fontSize: 18,
    lineHeight: 23.4,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 5,
  },

  shipmentCard: {
    borderWidth: 1,
    borderColor: '#ECEEF5',
    borderRadius: 15,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#F7F8FC',
  },
  shipmentHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  shipmentNumber: {
    fontSize: 9.9,
    letterSpacing: 0.8,
    fontWeight: '700',
    color: '#8A92A8',
  },
  categoryTitle: {flex: 1, fontSize: 17.1, fontWeight: '700', color: '#242637'},
  statusBadge: {
    backgroundColor: '#EEF0FF',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    maxWidth: '42%',
  },
  statusText: {fontSize: 11.7, fontWeight: '700', color: '#5146C9'},
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 7,
  },
  productTitle: {
    fontSize: 14.4,
    lineHeight: 18.9,
    color: '#353B48',
    fontWeight: '600',
  },
  productQuantity: {fontSize: 11.7, color: '#737B8C'},
  shipmentAmount: {flex: 1, minWidth: 0, gap: 4},
  shipmentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEEFF5',
    paddingTop: 8,
  },
  trackAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF0FF',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 40,
  },
  trackLabel: {fontSize: 12.6, fontWeight: '700', color: colors.primary},
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    paddingHorizontal: 4,
    minHeight: 40,
  },

  list: {paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24, gap: 22},
  order: {
    borderRadius: 17,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E8F2',
  },
  orderShadow: {
    elevation: 3,
    shadowColor: '#302B55',
    shadowOpacity: 0.1,
    shadowRadius: 7,
    shadowOffset: {width: 0, height: 3},
  },
  id: {fontSize: 13.5, fontWeight: '600', color: '#009740'},
  placed: {fontSize: 11.7, color: '#5C6975', marginTop: 2, marginBottom: 12},
  summary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  thumbnail: {
    width: 48,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  itemCount: {fontSize: 14.4, fontWeight: '700', color: colors.ink},
  prices: {flexDirection: 'row', alignItems: 'center', gap: 5},
  original: {
    fontSize: 11.7,
    color: '#5C6975',
    textDecorationLine: 'line-through',
  },
  amount: {fontSize: 13.5, fontWeight: '700', color: colors.ink},
  delivery: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
  },
  deliveryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111111',
    paddingBottom: 9,
    borderBottomWidth: 1,
    borderColor: '#EEEEEE',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingTop: 10,
  },
  addressLabel: {fontSize: 11, color: '#999999', marginBottom: 3},
  addressValue: {fontSize: 13, lineHeight: 18, color: '#333333'},
});
