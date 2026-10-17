import {Text} from '../Typography';
import React, {useEffect, useRef, useState} from 'react';
import {Animated, Pressable, StyleSheet, View} from 'react-native';
import {useSelector} from 'react-redux';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {money} from '../../config/catalog';
import ReferenceArtwork from './ReferenceArtwork';
import {useLiveItemsByIds} from '../../services/catalogService';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function CartPill({navigation, bottomInset = 0}) {
  const cart = useSelector(state => state.commerce.cart);
  const cartIds = Object.keys(cart);
  const {itemsById} = useLiveItemsByIds(cartIds);
  const items = cartIds
    .map(id => itemsById[id])
    .filter(Boolean);
  const count = Object.values(cart).reduce((total, qty) => total + qty, 0);
  const entrance = useRef(new Animated.Value(0)).current;
  const [entranceComplete, setEntranceComplete] = useState(false);
  useEffect(() => {
    if (count > 0) {
      setEntranceComplete(false);
      Animated.spring(entrance, {
        toValue: 1,
        damping: 16,
        stiffness: 180,
        mass: 0.8,
        useNativeDriver: true,
      }).start(({finished}) => {
        if (finished) {
          setEntranceComplete(true);
        }
      });
    } else {
      entrance.setValue(0);
      setEntranceComplete(false);
    }
  }, [count, entrance]);
  if (!count) {
    return null;
  }
  const total = items.reduce(
    (sum, item) => sum + item.price * cart[item.id],
    0,
  );
  return (
    <AnimatedPressable
      onPress={() => navigation.navigate('Cart')}
      style={[
        styles.pill,
        entranceComplete && styles.pillShadow,
        {bottom: bottomInset + 10},
        {
          opacity: entrance,
          transform: [
            {
              translateY: entrance.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
            {
              scale: entrance.interpolate({
                inputRange: [0, 1],
                outputRange: [0.92, 1],
              }),
            },
          ],
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`View cart, ${count} items, ${money(total)}`}>
      <View style={styles.images}>
        {items.slice(0, 2).map((item, index) => (
          <ReferenceArtwork
            key={item.id}
            art={item.art}
            width={30}
            height={30}
            style={{borderRadius: 15, marginLeft: index ? -12 : 0}}
          />
        ))}
      </View>
      <View>
        <Text style={styles.count}>
          {count} {count === 1 ? 'Item' : 'Items'}
        </Text>
        <Text style={styles.amount}>{money(total)}</Text>
      </View>
      <View style={styles.arrow}>
        <MaterialIcons name="chevron-right" size={24} color="#48535D" />
      </View>
    </AnimatedPressable>
  );
}
const styles = StyleSheet.create({
  pill: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#050505',
    borderRadius: 28,
    padding: 7,
    paddingLeft: 8,
  },
  pillShadow: {elevation: 5},
  images: {flexDirection: 'row'},
  count: {fontSize: 14, color: '#FFFFFF', fontWeight: '700'},
  amount: {fontSize: 11, color: '#FFFFFF'},
  arrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
