import React, { useEffect, useState, useRef, memo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Keyboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import {
  responsiveHeight,
  responsiveWidth,
} from 'react-native-responsive-dimensions';
import CategoryInactive from './tabassets/CategoryInactive';
import { getAllCategories, setActiveCategoryIndex, setsubCategory } from '../../redux/reducers/daddy';
import { useDispatch, useSelector } from 'react-redux';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { globalSearch } from '../../redux/reducers/addressSlice';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { getResultFullData } from '../../redux/reducers/reviews';
import { colors } from '../../config/theme';
import { getSearchShopList } from '../../redux/reducers/search';
import commonStyles from '../../commonstyles/CommonStyles';
import StatusBarManager from '../../components/StatusBarManager';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CategoriesScreen = ({ navigation, route }) => {
  const { allCategories } = useSelector(state => state.Dashboard);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const timeoutRef = useRef();
  const { globalSearchResults } = useSelector(state => state.address);
  

  useEffect(() => {
    const fetchCategories = async () => {
      await dispatch(getAllCategories());
      setLoading(false);
    };
    fetchCategories();
  }, [dispatch]);

  useEffect(() => {
    if (route.params?.isFromHome) {
      navigation.setOptions({
        headerLeft: () => (
          <TouchableOpacity
            style={{ marginLeft: 15 }}
            onPress={() => navigation.goBack()}
          >
            <FontAwesome6 name="arrow-left-long" size={20} color={colors.white} />
          </TouchableOpacity>
        )
      });
    }
  }, [navigation, route.params]);

  useEffect(() => {
    if (!allCategories) return;

    const groupedData = allCategories.reduce((acc, item) => {
      const { category_id, category_name, ...subCategory } = item;
      if (!acc[category_id]) {
        acc[category_id] = {
          category_id,
          category_name,
          sub_categories: []
        };
      }
      acc[category_id].sub_categories.push(subCategory);
      return acc;
    }, {});
    const result = Object.values(groupedData);
    setCategories(result);
    setFilteredCategories(result);
  }, [allCategories]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    clearTimeout(timeoutRef.current);

    if (query.trim()) {
      setSearchLoading(true);
      timeoutRef.current = setTimeout(() => {
        dispatch(globalSearch({ searchText: query })).then(() => setSearchLoading(false));
      }, 500);
    } else {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCategories(categories);
      return;
    }

    // 1. Conditional local filtering
    const localFiltered = route.params?.isFromHome
      ? []
      : categories.map(category => {
        const categoryMatches = category.category_name.toLowerCase().includes(searchQuery.toLowerCase());
        const subCategoryMatches = category.sub_categories.filter(sub =>
          sub.sub_category_name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return (categoryMatches || subCategoryMatches.length > 0) ? {
          ...category,
          sub_categories: categoryMatches ? category.sub_categories : subCategoryMatches
        } : null;
      }).filter(Boolean);

    // 2. Add API results if available
    const apiResults = (globalSearchResults || [])
      .filter(result => result.search_table === 'z_food_restaurant_item_lst_t')
      .map(result => ({
        category_id: `search-${result.search_id}`,
        category_name: 'Search Results',
        sub_categories: [{
          id: result.search_id,
          sub_category_name: result.search_text,
          sub_category_image: result.search_image
        }]
      }));

    // 3. Merge both results
    const combinedResults = [...localFiltered, ...apiResults];

    // 4. Remove duplicate categories
    const uniqueResults = combinedResults.filter((v, i, a) =>
      a.findIndex(t => t.category_id === v.category_id) === i
    );

    setFilteredCategories(uniqueResults);
  }, [searchQuery, categories, globalSearchResults]); // Single dependency array

  const handleNavigation = async (item, subItem) => {

    await dispatch(setActiveCategoryIndex(item.category_id));
    dispatch(setsubCategory(subItem));
    Keyboard.dismiss()
    navigation.navigate('CategorieItems');
  }

  const CategoryItem = memo(({ item, subItem, onNavigate }) => {
    if (typeof item?.category_id === 'string' && item.category_id.startsWith('search-')) {
      return (
        <TouchableOpacity
          style={styles.itemContainer}
          onPress={() => handleSearchResultPress(subItem)}
        >
          <View style={styles.itemCard}>
            <Image
              source={{ uri: subItem.sub_category_image }}
              style={styles.itemImage}
              resizeMode="cover"
            />
          </View>
          <Text numberOfLines={1} style={styles.itemName}>
            {subItem.sub_category_name}
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity onPress={() => onNavigate(item, subItem)} style={styles.itemContainer}>
        <View style={styles.itemCard}>
          <Image source={{ uri: subItem.sub_category_image }} resizeMode='stretch' style={styles.itemImage} />
        </View>
        <Text numberOfLines={1} style={styles.itemName}>
          {subItem.sub_category_name}
        </Text>
      </TouchableOpacity>
    );
  });

  const CategorySection = memo(({ item, onNavigate }) => (
    <View style={styles.categorySection}>
      <Text style={styles.categoryTitle}>{item.category_name}</Text>
      <FlatList
        data={item.sub_categories}
        renderItem={({ item: subItem }) => (
          <CategoryItem 
            item={item} 
            subItem={subItem} 
            onNavigate={onNavigate} 
          />
        )}
        keyExtractor={item => item.id}
        numColumns={3}
        columnWrapperStyle={styles.itemsGrid}
        scrollEnabled={false}
      />
    </View>
  ));

  const renderItem = (item, subItem) => {
    return (
      <CategoryItem 
        item={item} 
        subItem={subItem} 
        onNavigate={handleNavigation} 
      />
    );
  };

  const renderCategory = ({ item }) => (
    <CategorySection item={item} onNavigate={handleNavigation} />
  );

  const renderSearchResult = ({ item }) => (
    <TouchableOpacity
      style={styles.searchResultItem}
      onPress={() => handleSearchResultPress(item)}
    >
      <Image
        source={{ uri: item.search_image }}
        style={styles.searchResultImage}
        resizeMode="cover"
      />
      <View style={{ paddingHorizontal: responsiveWidth(2) }}>
        <Text style={styles.searchResultTitle} numberOfLines={1}>
          {item.search_text}
        </Text>
        <Text style={[styles.searchResultTitle, { color: "grey" }]} numberOfLines={1}>
          {item.search_tagline}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const handleSearchResultPress = async (result) => {
    // Handle navigation based on search result type

    Keyboard.dismiss()
    if (result.search_type == 2) {
      navigation.navigate('BannerRestaurantScreen', { ...result, fromSearch: true });
      return
    }
    navigation.navigate('SearchShopList', result);

    // const response = await dispatch(getSearchShopList({tableName:result.table_name,searchText:result.search_text}));


    // Example: navigation.navigate('SearchResultDetail', {result});
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* <LinearGradient colors={['#FD0', '#F7F2F2']} style={styles.gradientContainer}> */}
      <LinearGradient colors={['#D14A00', '#6C2600']} style={[styles.gradientContainer, { paddingTop: insets.top }]}>
        <View style={styles.headerContainer}>
          {route.params?.isFromHome ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <FontAwesome6 name="arrow-left-long" size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <FontAwesome6 name="arrow-left-long" size={20} color="#fff" />
            </TouchableOpacity>
          // <CategoryInactive color="#fff" />
          )
          }
          <Text style={styles.headerTitle}>All Categories</Text>
        </View>
        <View style={styles.searchContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              placeholderTextColor="#666666"
              placeholder="Search for your favorites"
              style={[styles.searchInput, { paddingRight: searchLoading ? 80 : 35 }]}
              value={searchQuery}
              onChangeText={handleSearch}
              selectionColor={commonStyles.appMainColor}
              autoFocus={!!route.params?.isFromHome}
            />
            <Icon name="search" size={24} color={commonStyles.appMainColor} style={styles.searchIcon} />
            {searchLoading ? (
              <ActivityIndicator
                size="small"
                color={commonStyles.appMainColor}
                style={[styles.loaderIndicator, { right: 55 }]}
              />
            ) : searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setSearchQuery('')}
              >
                <MaterialIcons name="close" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.loaderContainer}>
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="large" color="#065E2C" animating={true} />
          </View>
        </View>
      ) : (
        <>
          {searchQuery.trim() ? (
            <ScrollView style={styles.searchResultsContainer}>
              {/* Search Results Section */}
              {globalSearchResults?.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Search Results</Text>
                  <View>
                    <FlatList
                      scrollEnabled={false}
                      data={globalSearchResults}
                      renderItem={renderSearchResult}
                      keyExtractor={item => item.id.toString()}
                      showsHorizontalScrollIndicator={false}
                      style={{ paddingHorizontal: responsiveWidth(4) }}
                      contentContainerStyle={styles.searchResultsList}
                    />
                  </View>
                </>
              )}
              {/* Filtered Categories Section */}
              {filteredCategories.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Matching Categories</Text>
                  <FlatList
                    data={filteredCategories}
                    scrollEnabled={false}
                    renderItem={renderCategory}
                    keyExtractor={item => item.category_id}
                    contentContainerStyle={[styles.categoriesList, !route?.params?.isFromHome && { paddingBottom: 40 }]}
                    showsVerticalScrollIndicator={false}
                  />
                </>
              )}
              {/* Empty State */}
              {globalSearchResults?.length === 0 && filteredCategories.length === 0 && (
                <View style={styles.emptySearchContainer}>
                  <MaterialIcons name="search-off" size={40} color="#ccc" />
                  <Text style={styles.emptySearchText}>
                    No results found for "{searchQuery}"
                  </Text>
                </View>
              )}
            </ScrollView>
          ) : (
            <FlatList
              data={filteredCategories}
              renderItem={renderCategory}
              keyExtractor={item => item.category_id}
              contentContainerStyle={[styles.categoriesList, !route?.params?.isFromHome && { paddingBottom: 120, marginTop: responsiveHeight(2) }]}
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  gradientContainer: {
    paddingBottom: 0,
   
    borderBottomLeftRadius:20,
    borderBottomRightRadius:20
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(5),
    paddingTop: responsiveHeight(1),
    gap: 10,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: '700',
  },
  searchContainer: {
    marginTop: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    height: 47,
    paddingHorizontal: 10,
    marginHorizontal: responsiveWidth(3),
    marginVertical: responsiveHeight(3),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    flex: 1,
  },
  searchInput: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    flex: 1,
    paddingLeft: 40,
    paddingRight: 80,
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
  scrollViewContent: {
    paddingHorizontal: responsiveWidth(4),
    paddingBottom: responsiveHeight(15),
    paddingTop: responsiveHeight(2)
  },
  categorySection: {
    marginBottom: 10,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  itemsGrid: {
    justifyContent: 'flex-start',
    gap: responsiveWidth(4),
  },
  itemContainer: {
    width: responsiveWidth(28),
    height: responsiveHeight(17),
    backgroundColor: '#fff',
    // elevation: 2,
    marginVertical: responsiveHeight(1),
    // borderRadius: 8,
    justifyContent: 'center',
  },
  itemCard: {
    backgroundColor: '#fff',
    width: responsiveWidth(28),
    height: responsiveHeight(13),
    borderRadius: 8,
    alignSelf: 'flex-end',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemImage: {
    width: "100%",
    height: "100%",
    marginBottom: 8,
    borderRadius: 8,
  },
  itemName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#313131',
    textAlign: 'left',

    flex: 1,
    // marginHorizontal: responsiveWidth(2),
    textTransform: 'capitalize',
    textAlign: "center"
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: responsiveHeight(10),
    paddingBottom: responsiveHeight(15),
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  searchResultsContainer: {
    flex: 1,
    marginTop: responsiveHeight(2),
    // padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    marginHorizontal: responsiveWidth(4),
  },
  searchResultsList: {
    paddingBottom: 16,
  },
  searchResultItem: {
    // width: 200,
    marginRight: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    // padding: 12,
    paddingBottom: 12,
    // elevation: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  searchResultImage: {
    // width: '100%',
    height: responsiveHeight(7),
    width: responsiveHeight(7),
    borderRadius: responsiveHeight(20), // Rounded corners for the image
    // marginBottom: 8,
  },
  searchResultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#313131',
    marginBottom: 4,
  },
  searchResultType: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  categoriesList: {
    paddingHorizontal: 16,
    // paddingBottom: 24,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  loaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  loaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  emptySearchContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptySearchText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
});

export default CategoriesScreen;
