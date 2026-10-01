import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import Feather from 'react-native-vector-icons/Feather';
import HeaderPick2 from './tabassets/HeaderPick2';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import { useDispatch, useSelector } from 'react-redux';
import { getRestaurants } from '../../redux/reducers/daddy';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import commonStyles from '../../commonstyles/CommonStyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CategorieItems({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch()
  const { activeCategoryIndex, activeSubCategory } = useSelector(state => state.Dashboard)
  const [filterData, setFilterData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const timeoutRef = useRef();
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [apiRestaurants, setApiRestaurants] = useState([]); // Store API restaurants
  const [activeFilters, setActiveFilters] = useState(['All']);
  const [subCategoryId, setSubCategoryId] = useState(activeSubCategory?.sub_category_id);
  const [shopId, setShopId] = useState(activeSubCategory?.shop_id);
  // console.log("activeSubCategory--------------------",activeCategoryIndex, activeSubCategory)

  const handleFilter = (selected) => {
    console.log("selected--------------------", selected)

    if (selected.filter_name === 'All') {
      setActiveFilters(['All']);
      console.log("ralecdhu")
    } else {
      // For single selection, just set the active filter to the selected one
      console.log("vachindhiiiiiiiiiiiiii")
      setSubCategoryId(selected.filter_id);
      setShopId( selected.shop_ids);
      setActiveFilters([selected.filter_name]);
    }
  };

  const getFilters = async () => {
    try {
      setIsLoading(true);
      const getResponse = await dispatch(getRestaurants({
        categoryId: activeCategoryIndex,
        subCatergoryId: subCategoryId,
        shopId: shopId
      }));
      
      // console.log("get restaurants from API--------------------433333333333333333333333", getResponse.payload.data)
      setFilterData(getResponse.payload.data[1] || []);
      
      // Store the restaurants from the API response (already filtered by backend)
      const apiRestaurants = getResponse.payload.data[0] || [];
      // console.log("API restaurants count:", apiRestaurants.length);
      setApiRestaurants(apiRestaurants);
      setFilteredRestaurants(apiRestaurants); // Initially show all API restaurants
    
    } catch (error) {
      console.error('Error fetching data:', error);
      setFilterData([]);
    } finally {
      setIsLoading(false);
    }
  }



  useEffect(() => {
      getFilters() 
  }, [activeSubCategory.sub_category_id,subCategoryId,shopId])

  // Client-side filtering for search and additional filters (Veg/Non-Veg)
  useEffect(() => {
    if (!apiRestaurants || apiRestaurants.length === 0) return;
    const lowerQuery = searchQuery.toLowerCase();
    const filtered = apiRestaurants.filter(restaurant => {
      // Search matches
      const matchesSearch = restaurant.shop_name.toLowerCase().includes(lowerQuery) ||
        restaurant.shop_items?.some(item =>
          item.item_name.toLowerCase().includes(lowerQuery)
        );

      // Filter matches (for additional filters like Veg/Non-Veg)
      const matchesFilters = activeFilters.includes('All') ||
        activeFilters.some(filterName => {
          // Find the filter in filterData
          const filter = filterData.find(f => f.filter_name === filterName);
          if (!filter) return false;

          // Convert shop_ids string to array and check inclusion
          const shopIds = filter["GROUP_CONCAT(shop_id)"].split(',');
          return shopIds.includes(restaurant.shop_id.toString());
        });

      return matchesSearch && matchesFilters;
    });
 
    // console.log("Final filtered restaurants count:", filtered.length);
    setFilteredRestaurants(filtered);
  }, [searchQuery, activeFilters, filterData, apiRestaurants]);

  const calculateDeliveryTime = (distance) => {
    if (distance < 3) {
      return '15-20 mins';
    } else if (distance < 5) {
      return '20-30 mins';
    } else {
      return '30-45 mins';
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    clearTimeout(timeoutRef.current);

    if (query.trim()) {
      timeoutRef.current = setTimeout(() => {
        // Filtering is now handled by the useEffect
      }, 500);
    }
  };

  const mergedFilters = [
    { filter_name: 'All', filter_id: 'all' },
    ...(Array.isArray(filterData) ? filterData.filter(apiFilter =>
      apiFilter.filter_name !== 'All'
    ).map((filter, index) => ({
      ...filter,
      filter_id: filter.filter_id || `filter_${index}_${filter.filter_name}`
    })) : [])
  ];

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={commonStyles.appMainColor} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    if (!filteredRestaurants || filteredRestaurants.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="search-off" size={40} color="#ccc" />
          <Text style={styles.emptyText}>
            {searchQuery ? `No results for "${searchQuery}"` : 'No restaurants found'}
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={filteredRestaurants}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item, index) => item.shop_id.toString()}
        renderItem={({ item }) => {
         
          return (
            <TouchableOpacity
              onPress={() => navigation.navigate("RestaurantScreen", {
                shopId: item.shop_id,
                shopItem: item.shop_items_tb_nm,
                item,
                selectedFilter: activeFilters[0] === 'All' ? null : activeFilters[0]
              })}
              disabled={item.shop_active_status === "1"} // Disable if unavailable
            >
              <View style={[styles.card, item.shop_active_status === "1" && styles.unavailableCard]}>
                {item.active_status === "0" && (
                  <View style={styles.unavailableOverlay}>
                    <Text style={styles.unavailableText}>Currently Unavailable</Text>
                  </View>
                )}

                <Image
                  source={{ uri: item.shop_image }}
                  style={[styles.image, item.shop_active_status === "1" && styles.unavailableImage]}
                />

                <View style={styles.details}>
                  <Text style={[styles.name, item.shop_active_status === "1" && styles.unavailableText]}>
                    {item.shop_name}
                  </Text>
                  <View style={styles.ratingContainer}>
                    <MaterialCommunityIcons name="star-circle" color={commonStyles.appMainColor} />
                    <Text style={styles.rating}>{item?.shop_rating}</Text>
                    <Text style={styles.rating}>
                      {'\u25CF'} {calculateDeliveryTime(item?.distance)}   {/*  {item.time} */}
                    </Text>
                  </View>
                  <View style={styles.ratingContainer}>
                    <Text style={styles.location}>{item.shop_address}</Text>
                    <Text style={{ width: 4, height: 4, borderRadius: 20, backgroundColor: '#828282' }} />
                    <Text style={styles.location}>{item?.distance.toFixed(1)} km</Text>
                    {/* <View style={{}}>
                    <Text style={{width:5,height:5,borderRadius:20,backgroundColor:'gray'}} />
                    </View> */}
                    {/* <Text>hghd</Text> */}
                  </View>
                  {item.special_offer_name !== '' && (
                    <View style={styles.offerContainer}>
                      <Text style={styles.offer}>{item.special_offer_name}</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.dottedLineContainer}>
                {Array(20).fill(0).map((_, index) => (
                  <View key={index} style={styles.dot} />
                ))}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    );
  };

  const renderFilters = () => (
    <View>
      <FlatList
        data={mergedFilters}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => `${item.filter_id}_${item.filter_name}_${index}`}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => {
          const isActive = activeFilters.includes(item.filter_name);
          return (
            <TouchableOpacity
              onPress={() => handleFilter(item)}
              style={[
                styles.filterButton,
                {
                  borderColor: isActive ? "#0EAF50" : '#8F8F8F',
                  backgroundColor: isActive ? "#0EAF50" : '#fff',
                }
              ]}
            >
              {item.filter_name != "All" && (item.filter_name === "Veg" || item.filter_name === "Non Veg") && <HeaderPick2 color={
                item.filter_name === "Veg" ? (isActive ? "#fff" : "#0EAF50") :
                  item.filter_name === "Non Veg" ? "#CD2A2A" : "#065E2C"
              } />}
              <Text style={[styles.filterText, { color: isActive ? "#fff" : '#313131' }]}>
                {item.filter_name}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>

  );

  return (
      <View style={styles.main}>
        <StatusBar backgroundColor="transparent" translucent barStyle="light-content" />
        <View style={[styles.gradientContainer, { paddingTop: insets.top + 10, backgroundColor: '#D14A00' }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <AntDesign name="arrowleft" size={22} color="#fff" style={styles.backButton} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>
                {activeSubCategory?.sub_category_name}
              </Text>
            </View>
            <Image
              source={{ uri: activeSubCategory?.sub_category_image }}
              resizeMode='contain'
              style={styles.headerImage}
            />
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                placeholderTextColor="#666666"
                placeholder="Search restaurants..."
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={handleSearch}
              />
              <Icon name="search" size={24} color="gray" style={styles.searchIcon} />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setSearchQuery('')}
                >
                  <MaterialIcons name="close" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* {renderFilters()} */}

        {renderContent()}
      </View>
   
  );
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: '#fff',
  },
  gradientContainer: {
    paddingTop: 0,
    paddingBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd"
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    // marginBottom: responsiveHeight(2),
    paddingHorizontal: responsiveWidth(0),
    marginBottom: 10,
  },
  headerLeft: {
    flex: 1,
    paddingLeft: 20,
  },
  backButton: {
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3D3D3D',
  },
  headerImage: {
    width: 150,
    height: 100,
    borderRadius: 15,
    marginRight: 10,
  },
  filterList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  filterButton: {
    padding: 5,
    borderWidth: 1,
    borderRadius: 6,
    marginHorizontal: 3,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    width: responsiveWidth(100),
    height: responsiveHeight(50),
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    color: commonStyles.appMainColor,
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    width: responsiveWidth(100),
    height: responsiveHeight(50),
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    textAlign: "center",
    color: "#000",
    fontWeight: "700",
    fontSize: 16,
    marginTop: 10,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: responsiveWidth(5),
    paddingVertical: responsiveHeight(1),
    marginVertical: 10,
  },
  image: {
    width: 110,
    height: 100,
    borderRadius: 8,
  },
  heartButton: {
    position: 'absolute',
    width: 15,
    height: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    right: 5,
    top: 5,
  },
  details: {
    marginLeft: 10,
    width: responsiveWidth(55),
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#313131',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    gap: 3,
  },
  rating: {
    fontSize: 14,
    color: '#050505',
    fontWeight: '500',
  },
  location: {
    fontSize: 12,
    color: '#828282',
    fontWeight: '500',
  },
  offerContainer: {
    backgroundColor: '#ECFFF3',
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignSelf: "flex-start",
    borderRadius: 5,
    marginTop: 5,
  },
  offer: {
    color: '#07772F',
    fontSize: 10,
    fontWeight: '700',
  },
  moreButton: {
    width: 20,
    height: 20,
    borderRadius: 19,
    borderWidth: 0.5,
    alignItems: "center",
    justifyContent: "center",
  },
  dottedLineContainer: {
    flexDirection: 'row',
    marginTop: 5,
    alignSelf: 'center',
  },
  dot: {
    width: 5,
    height: 1.5,
    backgroundColor: '#D8D8D8',
    borderRadius: 5,
    marginHorizontal: 5.5,
  },
  searchContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    height: 47,
    marginHorizontal: responsiveWidth(5),
    elevation: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    flex: 1,
    paddingHorizontal: 15,
  },
  searchInput: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    flex: 1,
    paddingLeft: 40,
    paddingRight: 35,
  },
  searchIcon: {
    position: 'absolute',
    left: 15,
    zIndex: 1,
  },
  clearButton: {
    position: 'absolute',
    right: 15,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    padding: 5,
    zIndex: 1,
  },
  unavailableCard: {
    opacity: 0.6,
    backgroundColor: '#f5f5f5'
  },
  unavailableOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.7)',
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10
  },
  unavailableText: {
    color: '#888',
    fontWeight: 'bold'
  },
  unavailableImage: {
    opacity: 0.5
  }
});




  // useFocusEffect(useCallback(() => {
  //   getFilters()
  // }, [activeSubCategory]))
