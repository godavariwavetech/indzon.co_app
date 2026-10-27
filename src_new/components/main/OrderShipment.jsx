import React, {useState} from 'react';
import {Linking, Pressable, StyleSheet, View} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {Text} from '../Typography';
import ReferenceArtwork from './ReferenceArtwork';
import {money} from '../../config/catalog';

const stages = [
  'Placed',
  'Confirmed',
  'Packed',
  'Out for delivery',
  'Delivered',
];
export const shipmentStatus = (group, order) =>
  group.status || order.status || 'Confirmed';

// Star row to rate one delivered item; tapping a star saves it straight away.
function ItemRating({item, value, onRate, error}) {
  return (
    <View style={styles.itemRating}>
      <Text style={styles.ratingLabel}>
        {value ? 'Your rating' : 'Rate this item'}
      </Text>
      <View style={styles.ratingStars}>
        {[1, 2, 3, 4, 5].map(star => (
          <Pressable
            key={star}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={`Rate ${item.name} ${star} out of 5`}
            accessibilityState={{selected: value === star}}
            onPress={() => onRate(item, star)}>
            <MaterialIcons
              name={star <= value ? 'star' : 'star-border'}
              size={26}
              color={star <= value ? '#F7BD00' : '#B9BEC8'}
            />
          </Pressable>
        ))}
      </View>
      {error ? <Text style={styles.ratingError}>{error}</Text> : null}
    </View>
  );
}

export default function OrderShipment({
  group,
  order,
  items,
  navigation,
  onCancel,
  onRateItem,
}) {
  const [expanded, setExpanded] = useState(true);
  // stars chosen in this session, by item id (the saved ones come with the item)
  const [ratings, setRatings] = useState({});
  const [ratingErrors, setRatingErrors] = useState({});
  const status = shipmentStatus(group, order);
  const current = stages.findIndex(
    stage => stage.toLowerCase() === status.toLowerCase(),
  );
  const cancelled = status.toLowerCase() === 'cancelled';
  const shipmentItems = items.filter(item =>
    group.productIds.includes(item.id),
  );
  // items can be rated once their shipment has been delivered
  const canRate = Boolean(onRateItem) && order.live && status === 'Delivered';
  const rateItem = async (item, value) => {
    const previous = ratings[item.id];
    setRatings(current => ({...current, [item.id]: value}));
    setRatingErrors(current => ({...current, [item.id]: ''}));
    let saved = false;
    try {
      saved = await onRateItem(item, value);
    } catch (error) {
      saved = false;
    }
    if (!saved) {
      setRatings(current => ({...current, [item.id]: previous}));
      setRatingErrors(current => ({
        ...current,
        [item.id]: 'Could not save your rating. Please try again.',
      }));
    }
  };
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.icon}>
          <MaterialIcons name="inventory-2" size={23} color="#3832FF" />
        </View>
        <View style={styles.flex}>
          <Text style={styles.title}>{group.name}</Text>
          <Text style={styles.caption}>
            {group.count} items · {money(group.price)}
          </Text>
        </View>
        <View style={[styles.badge, cancelled && styles.cancelled]}>
          <Text style={[styles.status, cancelled && styles.cancelledText]}>
            {status}
          </Text>
        </View>
      </View>
      <Text style={styles.shipmentId}>
        Shipment {group.id || `${order.id}-${group.name}`}
      </Text>
      {shipmentItems.map(item => (
        <React.Fragment key={item.id}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`View ${item.name}`}
          onPress={() =>
            navigation.navigate('ProductDetails', {productId: item.id, liveProduct: item})
          }
          style={styles.product}>
          <ReferenceArtwork art={item.art} width={44} height={48} />
          <View style={styles.flex}>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.caption}>
              {item.unit} · Qty {item.quantity}
            </Text>
          </View>
          <Text style={styles.productName}>
            {money(item.price * item.quantity)}
          </Text>
        </Pressable>
        {canRate ? (
          <ItemRating
            item={item}
            value={ratings[item.id] ?? item.myRating ?? 0}
            onRate={rateItem}
            error={ratingErrors[item.id]}
          />
        ) : null}
        </React.Fragment>
      ))}
      {onRateItem && order.live && !canRate && !cancelled ? (
        <Text style={[styles.caption, {marginTop: 8}]}>
          You can rate these items once they are delivered.
        </Text>
      ) : null}
      {onCancel && order.live && status === 'Placed' ? (
        <Pressable
          style={styles.cancelButton}
          onPress={() => onCancel(group)}
          accessibilityRole="button"
          accessibilityLabel={`Cancel ${group.name} items`}>
          <MaterialIcons name="highlight-off" size={19} color="#BC3C47" />
          <Text style={styles.cancelButtonText}>Cancel {group.name} items</Text>
        </Pressable>
      ) : null}
      {cancelled && group.cancelReason ? (
        <Text style={[styles.caption, {color: '#BC3C47'}]}>
          {group.cancelReason}
        </Text>
      ) : null}
      <Pressable
        style={styles.trackButton}
        onPress={() => setExpanded(value => !value)}
        accessibilityRole="button"
        accessibilityLabel={`Track ${group.name} shipment`}
        accessibilityState={{expanded}}>
        <MaterialIcons name="local-shipping" size={20} color="#3832FF" />
        <Text style={styles.trackText}>Track this shipment</Text>
        <MaterialIcons
          name={expanded ? 'expand-less' : 'expand-more'}
          size={24}
          color="#3832FF"
        />
      </Pressable>
      {expanded ? (
        <View>
          {cancelled ? (
            <Text style={styles.cancelledText}>
              This shipment was cancelled.
            </Text>
          ) : (
            stages.map((stage, index) => {
              const complete = index <= current;
              const event = group.tracking?.find(
                entry => entry.status.toLowerCase() === stage.toLowerCase(),
              );
              return (
                <View key={stage} style={styles.step}>
                  <View style={styles.rail}>
                    <MaterialIcons
                      name={
                        complete ? 'check-circle' : 'radio-button-unchecked'
                      }
                      size={21}
                      color={complete ? '#3832FF' : '#BDC2CE'}
                    />
                    {index < stages.length - 1 ? (
                      <View
                        style={[
                          styles.line,
                          index < current && styles.completeLine,
                        ]}
                      />
                    ) : null}
                  </View>
                  <View style={styles.flex}>
                    <Text
                      style={[styles.productName, !complete && styles.pending]}>
                      {stage}
                    </Text>
                    <Text style={styles.caption}>
                      {event?.at || (complete ? 'Completed' : 'Pending')}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
          <View style={styles.partner}>
            <Text style={styles.productName}>Delivery partner</Text>
            <Text style={styles.caption}>
              {group.deliveryPartner?.name ||
                (cancelled
                  ? 'Not assigned'
                  : 'Partner details will appear when assigned.')}
            </Text>
            {group.deliveryPartner?.phone ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Call ${group.deliveryPartner.name}`}
                onPress={() =>
                  Linking.openURL(`tel:${group.deliveryPartner.phone}`)
                }>
                <Text style={[styles.caption, {color: '#3832FF'}]}>
                  Call {group.deliveryPartner.phone}
                </Text>
              </Pressable>
            ) : null}
            {group.deliveryPartner?.rating ? (
              <Text style={styles.caption}>
                Rating: {group.deliveryPartner.rating} ★
              </Text>
            ) : null}
            {group.trackingNumber ? (
              <Text style={styles.caption}>
                Tracking ID: {group.trackingNumber}
              </Text>
            ) : null}
            {group.estimatedDelivery ? (
              <Text style={styles.caption}>
                Expected delivery: {group.estimatedDelivery}
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#E5E4F2',
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginTop: 14,
  },
  flex: {flex: 1},
  row: {flexDirection: 'row', alignItems: 'center', gap: 10},
  icon: {backgroundColor: '#EFEDFF', borderRadius: 12, padding: 10},
  title: {fontSize: 21, lineHeight: 26, fontWeight: '700', color: '#202427'},
  caption: {fontSize: 15, lineHeight: 21, color: '#687384', marginTop: 3},
  badge: {
    backgroundColor: '#E8F7F0',
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 12,
    maxWidth: '38%',
  },
  status: {fontSize: 14, fontWeight: '700', color: '#13835B'},
  cancelled: {backgroundColor: '#FFF0F0'},
  cancelledText: {fontSize: 15, color: '#B83636'},
  shipmentId: {fontSize: 13, color: '#838A98', marginVertical: 12},
  product: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
  },
  productName: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: '#202427',
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#EEEFF5',
    marginTop: 10,
  },
  trackText: {flex: 1, fontSize: 17, fontWeight: '700', color: '#3832FF'},
  step: {flexDirection: 'row', gap: 12, minHeight: 57},
  rail: {alignItems: 'center', width: 23},
  line: {width: 2, flex: 1, backgroundColor: '#E6E8EF', marginVertical: 4},
  completeLine: {backgroundColor: '#3832FF'},
  pending: {color: '#8B92A0'},
  itemRating: {
    marginLeft: 54,
    marginTop: -4,
    marginBottom: 6,
  },
  ratingLabel: {fontSize: 13, color: '#687384'},
  ratingStars: {flexDirection: 'row', gap: 4, marginTop: 4},
  ratingError: {fontSize: 12, color: '#BC3C47', marginTop: 4},
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 42,
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5B3B8',
    backgroundColor: '#FFF0F0',
  },
  cancelButtonText: {fontSize: 14, fontWeight: '700', color: '#BC3C47'},
  partner: {
    backgroundColor: '#F7F7FB',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
});
