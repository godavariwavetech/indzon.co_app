import React,{useState,useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import commonStyles from '../../commonstyles/CommonStyles';
import { useNavigation } from '@react-navigation/native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ReviewStar from '../daddy/tabassets/ReviewStar';
import DotsVertical from '../daddy/svg/DotsVertical';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import VegIcon from '../daddy/svg/VegIcon';
import NonVegIcon from '../daddy/svg/NonVEgIcon';


const { width } = Dimensions.get('window');

const filters = [
    { label: 'All', icon: 'all' }, 
    { label: 'Veg', icon: 'veg' },         // Use an appropriate icon
    { label: 'Non-Veg', icon: 'nonveg' }, // Custom non-veg icon
    { label: 'Best Seller', icon: 'medal' },
];
const restaurants = [
  {
    id: '1',
    name: 'Vantalakka Biriyani',
    type: 'Street Food, Shake, Beverages',
    time: '20-30 mins',
    distance: '3.0 km',
    image: require('../daddy/svg/food.png'),
  },
  {
    id: '2',
    name: 'Naidu Gari Kunda Biryani',
    type: 'Fried Rice, Chinese, Italian',
    time: '20-30 mins',
    distance: '3.0 km',
    image: require('../daddy/svg/biryani.png'),
  },
  {
    id: '3',
    name: 'Helapuri Restaurant- Diamond',
    type: 'North Indian, Chinese, Biry...',
    time: '20-30 mins',
    distance: '3.0 km',
    image: require('../daddy/svg/biryani.png'),
  },
  {
    id: '4',
    name: 'Real Deepa Punjabi Dhaba',
    type: 'North Indian, South Indian...',
    time: '20-30 mins',
    distance: '3.0 km',
    image: require('../daddy/svg/biryani.png'),
  },
  {
    id: '5',
    name: 'Kalyani Mess',
    type: 'Fried Rice, Chinese, Italian',
    time: '20-30 mins',
    distance: '3.0 km',
    image: require('../daddy/svg/biryani.png'),
  },
];

const RestaurantCard = ({ item }) => (
  <View style={styles.card}>
        <View style={{position:'relative'}}>
            <Image source={item.image} style={styles.cardImage} />
            <TouchableOpacity style={styles.heartIcon}>
               <AntDesign name="hearto" size={18} color="#EC0000" />
            </TouchableOpacity>
        </View>
    <View style={styles.cardDetails}>
        <View style={{flexDirection:'row',alignItems:'center'}}>
          <Text style={[commonStyles.label,{color:'#313131',flex:1}]} numberOfLines={2}>{item.name}</Text>
          <TouchableOpacity style={{flex:0}}>
            {/* <MaterialCommunityIcons name='dots-vertical-circle-outline' size={20} color='#A3A3A3' /> */}
            <DotsVertical />
          </TouchableOpacity>
        </View>
      <View style={{flex:1}}>
      <View style={[styles.cardMeta,{gap:4}]}>
        <Icon name='stars' size={15} color='#5c5000' />
        <Text style={styles.rating}>4.5 (26k+)</Text>
        <Text style={styles.rating}>•</Text>
        <Text style={[styles.rating,{flex:1}]}>{item.time}</Text>
        {/* <Text style={styles.dot}>•</Text> */}
      </View>
      </View>
      <Text style={styles.cardSubtitle} numberOfLines={1}>{item.type}</Text>
      <View style={[styles.cardMeta]}>
        <Text style={[styles.cardSubtitle,{fontSize:12}]} numberOfLines={2}>Tilak rood</Text>
        {/* <ReviewStar/> */}
        <Text style={[styles.dot,{}]}>•</Text> 
        <Text style={[styles.cardSubtitle,{fontSize:12}]}>{item.distance}</Text>
      </View>
      <View style={styles.offerTag}>
        <Text style={styles.offerText}>EXTRA 10% OFF & FREE DELIVERY</Text>
      </View>
    </View>
  </View>
);

const RestaurantsScreen = () => {
  const insets = useSafeAreaInsets();
    const [selectedFilter, setSelectedFilter] = useState(null);
    const [searchText, setSearchText] = useState('');

    const navigation = useNavigation();

    const filteredRestaurants = restaurants.filter(restaurant =>
        restaurant.name.toLowerCase().includes(searchText.toLowerCase())
      );

  return (
    <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      {/* Header */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + 16, backgroundColor: '#ff417f' }]}>
        <View style={styles.headerContent}>
          <View>
            <TouchableOpacity onPress={()=>navigation.goBack()}>
                <AntDesign name="arrowleft" size={22} color="#FFF"  />
            </TouchableOpacity>
            <Text style={[commonStyles.heading2,{color:'#fff',paddingTop:10}]}>Biryani</Text>
            <Text style={styles.headerSubtitle}>Where Biryani fall in love!</Text>
          </View>
          <Image
            source={require('../daddy/svg/biryani.png')}
            style={styles.headerImage}
          />
        </View>
      </View>

      {/* Filters */}
      <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.filterContainer]}
      >
        <TouchableOpacity style={styles.filterButton}>
          <Icon name="filter-list" size={18} color="#000" />
          <Text style={styles.filterText}>Filter</Text>
        </TouchableOpacity>
        {filters.map((filter, index) => {
            const isSelected = selectedFilter==filter.label;
            return(
                <TouchableOpacity key={index} style={[styles.filterButton,isSelected && {backgroundColor:'#fff5b7'}]} onPress={()=>setSelectedFilter(filter.label)}>
            {/* Choose the icon based on filter.label */}
                {filter.label === 'Veg' && ( <VegIcon /> )}
                {filter.label === 'Non-Veg' && (
                    <NonVegIcon />
                )}
                {filter.label === 'Best Seller' && (
                    <FontAwesome5 name="medal" size={14} color="#FFD700" />
                )}
            <Text style={styles.filterText}>{filter.label}</Text>
          </TouchableOpacity>
            )
        })}
      </ScrollView>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput placeholder="Search Restaurant’s" style={[commonStyles.text3,{color:'#919191',flex:1}]}
            value={searchText}
            onChangeText={setSearchText}  
        />
        <AntDesign name="search1" size={20} color="#009158" />
      </View>

      {/* Restaurant List */}
      <FlatList
        data={filteredRestaurants}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (<><RestaurantCard item={item} /><Text style={styles.dashed} /></>)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24,paddingTop:24 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    // paddingTop: 16,
  },
  headerContainer: {
    minHeight: 166,
    padding: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop:24
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    paddingTop:10
  },
  headerSubtitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight:'400',
    marginTop: 4,
  },
  headerImage: {
    width: 174,
    height: 100,
    resizeMode:'contain'
  },
  filterContainer: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    paddingBottom:12,
    marginTop:12,
    // zIndex:10
  },
  filterButton: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 10,
    alignItems: 'center',
    borderColor: '#B8B8B8', 
    borderWidth: 1,
    borderRadius:8,
    backgroundColor:'#fff'
  },
  filterText: {
    fontSize: 14,
    fontWeight:'500',
    color: '#2F344A',
    marginLeft: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
    marginHorizontal: 16,
    paddingHorizontal: 20,
    paddingVertical: 5,
    alignItems: 'center',
    // marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    marginRight: 10,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    // marginBottom: 16,
    // elevation: 2,
    // padding: 10,
  },
  cardImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    resizeMode:'cover'
  },
  cardDetails: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#828282',
    fontWeight:'500',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  rating: {
    fontSize: 14,
    color: '#050505',
    fontWeight:'500'
  },
  dot: {
    marginHorizontal: 4,
    color: '#999',
  },
  time: {
    fontSize: 12,
    color: '#333',
  },
  distance: {
    fontSize: 12,
    color: '#333',
  },
  offerTag: {
    backgroundColor: '#fff5b7',
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  offerText: {
    fontSize: 10,
    color: '#5C5000',
    fontWeight:'700'
  },
  dashed:{
    borderBottomWidth:1,
    borderStyle:'dashed',
    marginBottom:16,
    borderColor:'#D8D8D8'
  },
  heartIcon:{
    position:'absolute',
    top:8,
    right:8,
    backgroundColor:"#fff",
    padding:3,
    borderRadius:50,
    zIndex:1
  }
});

export default RestaurantsScreen;
