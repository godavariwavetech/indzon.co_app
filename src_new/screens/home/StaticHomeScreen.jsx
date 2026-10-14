import React, {useState} from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useSelector} from 'react-redux';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {sampleCategories, sampleShops} from '../../config/staticData';

export default function StaticHomeScreen({navigation}) {
  const insets = useSafeAreaInsets();
  const address = useSelector(state => state.Auth.deliveryAddress);
  const [categoryId, setCategoryId] = useState(sampleCategories[0].id);
  const [subcategory, setSubcategory] = useState(null);
  const [query, setQuery] = useState('');
  const category = sampleCategories.find(item => item.id === categoryId);
  const shops = sampleShops.filter(
    shop =>
      shop.categoryId === categoryId &&
      (!subcategory || shop.subcategory === subcategory) &&
      `${shop.name} ${shop.subcategory}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  return (
    <View style={[styles.screen, {paddingTop: insets.top}]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <ScrollView
        contentContainerStyle={{paddingBottom: insets.bottom + 24}}
        keyboardShouldPersistTaps="handled">
        <Pressable
          style={styles.header}
          onPress={() => navigation.navigate('AddressList')}
          accessibilityRole="button"
          accessibilityLabel="Change delivery address">
          <MaterialIcons name="location-on" size={26} color="#3832FF" />
          <View style={styles.flex}>
            <Text style={styles.addressType}>
              {address?.address_type || 'Delivery location'}
            </Text>
            <Text style={styles.address} numberOfLines={1}>
              {address?.full_address || 'Choose your address'}
            </Text>
          </View>
          <MaterialIcons name="keyboard-arrow-down" size={24} color="#202427" />
        </Pressable>
        <View style={styles.search}>
          <MaterialIcons name="search" size={22} color="#748092" />
          <TextInput
            style={styles.flex}
            value={query}
            onChangeText={setQuery}
            placeholder="Search restaurants and shops"
            accessibilityLabel="Search restaurants and shops"
          />
        </View>
        <View style={styles.categories}>
          {sampleCategories.map(item => (
            <Pressable
              key={item.id}
              style={styles.category}
              accessibilityRole="button"
              accessibilityState={{selected: item.id === categoryId}}
              onPress={() => {
                setCategoryId(item.id);
                setSubcategory(null);
                setQuery('');
              }}>
              <View
                style={[
                  styles.artwork,
                  item.id === categoryId && styles.activeArtwork,
                ]}>
                <MaterialIcons
                  name={item.icon}
                  size={32}
                  color={item.id === categoryId ? '#3832FF' : '#63808E'}
                />
              </View>
              <Text
                style={[
                  styles.categoryName,
                  item.id === categoryId && styles.activeText,
                ]}>
                {item.name}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Fresh picks for your day</Text>
          <Text style={styles.bannerCopy}>
            Explore your favourite food and everyday essentials
          </Text>
        </View>
        <Text style={styles.heading}>{category.name} Categories</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}>
          {[null, ...category.subcategories].map(item => (
            <Pressable
              key={item || 'all'}
              onPress={() => setSubcategory(item)}
              accessibilityRole="button"
              accessibilityState={{selected: item === subcategory}}
              style={[styles.chip, item === subcategory && styles.activeChip]}>
              <Text
                style={
                  item === subcategory ? styles.activeText : styles.chipText
                }>
                {item || 'All'}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <Text style={styles.heading}>
          Popular {categoryId === 'food' ? 'Restaurants' : 'Shops'}
        </Text>
        {shops.map(shop => (
          <View key={shop.id} style={styles.shop}>
            <View style={styles.shopArtwork}>
              <MaterialIcons name={shop.icon} size={42} color="#3832FF" />
            </View>
            <View style={styles.flex}>
              <Text style={styles.shopName}>{shop.name}</Text>
              <Text style={styles.shopCopy}>{shop.subcategory}</Text>
              <Text style={styles.shopCopy}>
                ★ {shop.rating} · {shop.time}
              </Text>
            </View>
          </View>
        ))}
        {!shops.length ? (
          <Text style={styles.empty}>
            No matching shops. Try another search.
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#FFFFFF'},
  flex: {flex: 1, color: '#202427'},
  header: {flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16},
  addressType: {color: '#202427', fontSize: 17, fontWeight: '700'},
  address: {color: '#748092', fontSize: 12, marginTop: 3},
  search: {
    marginHorizontal: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F8',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
  },
  categories: {flexDirection: 'row', flexWrap: 'wrap', padding: 12},
  category: {width: '25%', alignItems: 'center', padding: 6},
  artwork: {
    width: 64,
    height: 70,
    borderRadius: 28,
    backgroundColor: '#F3F6F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeArtwork: {
    backgroundColor: '#EAE8FF',
    borderWidth: 1,
    borderColor: '#3832FF',
  },
  categoryName: {
    fontSize: 11,
    textAlign: 'center',
    color: '#202427',
    marginTop: 7,
    minHeight: 28,
  },
  activeText: {color: '#3832FF', fontWeight: '700'},
  banner: {
    margin: 16,
    borderRadius: 16,
    padding: 22,
    backgroundColor: '#EAE8FF',
  },
  bannerTitle: {fontSize: 23, fontWeight: '700', color: '#23215F'},
  bannerCopy: {fontSize: 13, lineHeight: 20, color: '#536892', marginTop: 8},
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: '#202427',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
  },
  filters: {paddingHorizontal: 16, gap: 8, paddingBottom: 12},
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DFE6F5',
  },
  activeChip: {backgroundColor: '#EAE8FF', borderColor: '#3832FF'},
  chipText: {color: '#48535D'},
  shop: {
    marginHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderBottomWidth: 1,
    borderColor: '#EEF0F5',
  },
  shopArtwork: {
    width: 100,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#F3F4F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopName: {fontSize: 17, fontWeight: '700', color: '#202427'},
  shopCopy: {fontSize: 12, color: '#748092', marginTop: 7},
  empty: {color: '#748092', padding: 24, textAlign: 'center'},
});
