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
import React, {useCallback, useEffect, useState, useRef} from 'react';
import Feather from 'react-native-vector-icons/Feather';
import HeaderPick1 from './tabassets/HeaderPick1';
import HeaderPick2 from './tabassets/HeaderPick2';
import HeaderPick3 from './tabassets/HeaderPick3';
import Seller from './tabassets/Seller';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  responsiveHeight,
  responsiveWidth,
} from 'react-native-responsive-dimensions';
import {useDispatch, useSelector} from 'react-redux';
import {getRestaurants} from '../../redux/reducers/daddy';
import {useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {getSearchCategory, getSearchShopList, getSearchSubCategory} from '../../redux/reducers/search';
import {indiviadualShop} from '../../redux/reducers/addressSlice';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

export default function SearchShopList({navigation, route}) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const {activeSubCategory} = useSelector(state => state.Dashboard);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const timeoutRef = useRef();
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [activeFilters, setActiveFilters] = useState(['All']);

  // const handleFilter = (selected) => {
  //   if (selected.filter_name === 'All') {
  //     setActiveFilters(['All']);
  //   } else {
  //     // For single selection, just set the active filter to the selected one
  //     setActiveFilters([selected.filter_name]);
  //   }
  // };

  // const getFilters = async () =>{
  //   try {
  //     setIsLoading(true);
  //     const getResponse = await dispatch(getRestaurants({
  //       categoryId: activeCategoryIndex,
  //       subCatergoryId: activeSubCategory.sub_category_id
  //     }));

  //     setFilterData(getResponse.payload.data[1] || []);

  //   } catch (error) {
  //     console.error('Error fetching data:', error);
  //     setFilterData([]);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // }

  const handleApiCall = async (searchType) => {
    try {
      let response;
      if(searchType == 1) {
         response = await dispatch(
          getSearchShopList({
            tableName: route.params.table_name,
            searchText: route.params.search_text,
          }),
        ); 
      }else if( searchType == 3) {
        response =  await dispatch(
          getSearchCategory({
            tableName: route.params.table_name,
            searchId: route.params.id
          }),
        ); 
      }else if( searchType == 4) {
        response = await dispatch(
          getSearchSubCategory({
            tableName: route.params.table_name,
            searchId: route.params.id
          }),
        );
      }
      return response
    } catch(e){
      console.error(e, '++++++++++++++Error');
    }
  }

  const getShopDetails = async () => {
    try {
     
      setIsLoading(true);
      const response = await handleApiCall(route?.params?.search_type);
     
      const shopDetails = await dispatch(
        indiviadualShop({
          shopId: response.payload.data[0].shop_ids,
          categoryId: response.payload.data[0].category_id,
        }),
      );
      setFilteredRestaurants(shopDetails.payload.data[0]);
      setIsLoading(false);
    } catch (e) {
      setIsLoading(false);
     
    }
  };

  useEffect(() => {
    route?.params && getShopDetails();
  }, [route.params]);



  // useFocusEffect(useCallback(()=>{
  //   getFilters()
  // },[activeSubCategory]))

  // useEffect(()=>{
  //   if(activeSubCategory) {
  //     getFilters()
  //   }
  // },[activeSubCategory])

  // useEffect(() => {
  //   if (!restaurants) return;

  //   const lowerQuery = searchQuery.toLowerCase();
  //   const filtered = restaurants.filter(restaurant => {
  //     // Search matches
  //     const matchesSearch = restaurant.shop_name.toLowerCase().includes(lowerQuery) ||
  //                           restaurant.shop_items?.some(item =>
  //                             item.item_name.toLowerCase().includes(lowerQuery)
  //                           );

  //     // Filter matches
  //     const matchesFilters = activeFilters.includes('All') ||
  //       activeFilters.some(filterName => {
  //         // Find the filter in filterData
  //         const filter = filterData.find(f => f.filter_name === filterName);
  //         if (!filter) return false;

  //         // Convert shop_ids string to array and check inclusion
  //         const shopIds = filter["GROUP_CONCAT(shop_id)"].split(',');
  //         return shopIds.includes(restaurant.shop_id.toString());
  //       });

  //     return matchesSearch && matchesFilters;
  //   });

  //   setFilteredRestaurants(filtered);
  // }, [searchQuery, restaurants, activeFilters, filterData]);

  const handleSearch = query => {
    setSearchQuery(query);
    clearTimeout(timeoutRef.current);

    if (query.trim()) {
      timeoutRef.current = setTimeout(() => {
        // Filtering is now handled by the useEffect
      }, 500);
    }
  };

  // const mergedFilters = [
  //   { filter_name: 'All', filter_id: 'all' },
  //   ...(Array.isArray(filterData) ? filterData.filter(apiFilter =>
  //     apiFilter.filter_name !== 'All'
  //   ) : [])
  // ];

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#065E2C" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    if (!filteredRestaurants || filteredRestaurants.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="search-off" size={40} color="#ccc" />
          <Text style={styles.emptyText}>
            {searchQuery
              ? `No results for "${searchQuery}"`
              : 'No restaurants found'}
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={filteredRestaurants}
        showsVerticalScrollIndicator={false}
        keyExtractor={item => item.id}
        renderItem={({item}) => {
       
          return (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('RestaurantScreen', {
                  shopId: item.shop_id,
                  shopItem: item.shop_items_tb_nm,
                  item,
                  selectedFilter:
                    activeFilters[0] === 'All' ? null : activeFilters[0],
                })
              }
              disabled={item.shop_active_status === '1'} // Disable if unavailable
            >
              <View
                style={[
                  styles.card,
                  item.shop_active_status === '1' && styles.unavailableCard,
                ]}>
                {item.active_status === '0' && (
                  <View style={styles.unavailableOverlay}>
                    <Text style={styles.unavailableText}>
                      Currently Unavailable
                    </Text>
                  </View>
                )}

                <Image
                  source={{uri: item.shop_image}}
                  style={[
                    styles.image,
                    item.shop_active_status === '1' && styles.unavailableImage,
                  ]}
                />

                <View style={styles.details}>
                  <Text
                    style={[
                      styles.name,
                      item.shop_active_status === '1' && styles.unavailableText,
                    ]}>
                    {item.shop_name}
                  </Text>
                  <View style={styles.ratingContainer}>
                    <MaterialCommunityIcons
                      name="star-circle"
                      color="#07772F"
                    />
                    <Text style={styles.rating}> {item.shop_rating}</Text>
                    <Text style={styles.rating}>
                      {'\u25CF'} {item.time}
                    </Text>
                  </View>
                  <Text style={styles.location}>
                    {item.shop_address} / {item?.distance.toFixed(2)} KM
                  </Text>
                  {item.special_offer_name !== '' && (
                    <View style={styles.offerContainer}>
                      <Text style={styles.offer}>
                        {item.special_offer_name}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.dottedLineContainer}>
                {Array(20)
                  .fill(0)
                  .map((_, index) => (
                    <View key={index} style={styles.dot} />
                  ))}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    );
  };

  // const renderFilters = () => (
  //   <View>
  //   <FlatList
  //     data={mergedFilters}
  //     horizontal
  //     showsHorizontalScrollIndicator={false}
  //     keyExtractor={item => item.filter_id}
  //     contentContainerStyle={styles.filterList}
  //     renderItem={({item}) => {
  //       const isActive = activeFilters.includes(item.filter_name);
  //       return (
  //         <TouchableOpacity
  //           onPress={() => handleFilter(item)}
  //           style={[
  //             styles.filterButton,
  //             {
  //               borderColor: isActive ? "#0EAF50" : '#8F8F8F',
  //               backgroundColor: isActive ? "#0EAF50" : '#fff',
  //             }
  //           ]}
  //         >
  //          {item.filter_name!="All" && <HeaderPick2 color={
  //             item.filter_name === "Veg" ? (isActive ? "#fff" : "#0EAF50") :
  //             item.filter_name === "Non Veg" ? "#CD2A2A" : "#065E2C"
  //           } />}
  //           <Text style={[styles.filterText, { color: isActive ? "#fff" : '#313131' }]}>
  //             {item.filter_name}
  //           </Text>
  //         </TouchableOpacity>
  //       );
  //     }}
  //   />
  //   </View>

  // );

  return (
    <View style={styles.main}>
      <StatusBar
        backgroundColor={'transparent'}
        translucent
        barStyle={'light-content'}
      />
      <View style={[styles.gradientContainer, { paddingTop: insets.top + 8, backgroundColor: '#FFCC00' }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Feather
                name="arrow-left"
                color={'#000'}
                size={20}
                style={styles.backButton}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {route?.params?.search_text}
            </Text>
            {/* <Text style={styles.headerSubtitle}>
              Where Briyani fall in love!
            </Text> */}
          </View>
          <View style={styles.headerImageContainer}>
            <Image
            source={{uri:route?.params?.search_image}}
            resizeMode="contain"
            style={styles.headerImage}
          />
          </View>
          
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
            <Icon
              name="search"
              size={24}
              color="gray"
              style={styles.searchIcon}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setSearchQuery('')}>
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
    paddingBottom: 10,
    width: '100%',
    alignSelf: 'stretch',
    flexShrink: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(5),
    minHeight: 88,
  },
  headerImageContainer: {
    width: 72,
    height: 72,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginLeft: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3D3D3D',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    overflow: 'hidden',
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
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#065E2C',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    width: responsiveWidth(100),
    height: responsiveHeight(50),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#000',
    fontWeight: '700',
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
    width: 80,
    height: 80,
    borderRadius: 10,
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
    alignSelf: 'flex-start',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  dottedLineContainer: {
    flexDirection: 'row',
    marginTop: 5,
    alignSelf: 'center',
  },
  dot: {
    width: 7,
    height: 2,
    backgroundColor: '#D8D8D8',
    borderRadius: 5,
    marginHorizontal: 5,
  },
  searchContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    height: 56,
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
    backgroundColor: '#f5f5f5',
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
    borderRadius: 10,
  },
  unavailableText: {
    color: '#888',
    fontWeight: 'bold',
  },
  unavailableImage: {
    opacity: 0.5,
  },
});
