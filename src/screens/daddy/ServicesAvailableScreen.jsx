import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
  BackHandler,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { checkServiceAvailability, getServices } from '../../redux/reducers/daddy';
import { responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { setLocation, setLocationId, setLocationName } from '../../redux/reducers/auth';
import commonStyles from '../../commonstyles/CommonStyles';
import { colors } from '../../config/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

const ServicesAvailableScreen = ({ navigation, route }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAreas, setFilteredAreas] = useState([]);
  const { availableAreas, loading } = useSelector(state => state.Dashboard);
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  console.log("availableAreas--------------------", availableAreas)

  useEffect(() => {
    dispatch(getServices());
  }, []);

  useEffect(() => {
    if (availableAreas) {
      // Filter out locations with active_status === 1 (service not available)
      // Only show locations with active_status === 0 (service available)
      setFilteredAreas(availableAreas?.filter(area =>
        area.active_status !== 1 && // Hide inactive locations
        area.location_name.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    }
  }, [searchQuery, availableAreas]);

  const handleAreaSelect = (area) => {
    dispatch(setLocation({ latitude: area.location_latitude, longitude: area.location_longitude }))
    dispatch(setLocationName(area.location_name))
    dispatch(setLocationId(area.id))
    navigation.navigate("BottomNavigation")
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await dispatch(getServices());
    } finally {
      setRefreshing(false);
    }
  };

  console.log(filteredAreas,">>>>>>>>>>>>>>>filteredAreas");


  return (
    <View style={[styles.container]}>
      <StatusBar backgroundColor={commonStyles.appMainColor} translucent={true} barStyle="light-content" />
      <LinearGradient colors={['#D14A00', '#6C2600']} style={[styles.header, { paddingTop: insets.top + 10 }]}>
          {/* <View style={[styles.header, { paddingTop: Math.max(insets.top, responsiveHeight(2)) }]}> */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              {!route?.params?.permissionDenied && <FontAwesome6 name="arrow-left-long" size={20} color={colors.white} />}
            </TouchableOpacity>
            <Text style={styles.title}>Available Service Areas</Text>
          {/* </View> */}
      </LinearGradient>

        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search service areas..."
            placeholderTextColor={colors.gray}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <MaterialIcons name="search" size={24} color={colors.green} />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.green} style={styles.loader} />
        ) : (
          <FlatList
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colors.green]}
                tintColor={colors.green}
              />
            }
            data={filteredAreas}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 16 }]}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.areaCard}
                onPress={() => handleAreaSelect(item)}
              >
                <View style={styles.areaInfo}>
                  <Text style={styles.areaName}>{item.location_name}</Text>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailText}>
                      <MaterialIcons name="location-pin" size={16} color={colors.green} />
                      {item.maximum_delivery_service_km} km radius
                    </Text>
                    {/* <Text style={styles.detailText}>
                    <MaterialIcons name="delivery-dining" size={16} color={colors.green} />
                    Free Delivery
                  </Text> */}
                  </View>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.green} />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>

                <Text style={styles.emptyText}>No service available in this area</Text>
              </View>
            }
          />
        )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white, // centralized color
    // paddingTop: responsiveHeight(2),
  },
  header: {
    // backgroundColor: commonStyles.appMainColor,
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 16,
    paddingLeft: responsiveWidth(5),
    gap: 10,
    width: '100%',
    flexShrink: 0,
  },
  backButton: {
    width: responsiveWidth(7)
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    textAlign: "left"
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white, // centralized color
    borderRadius: 10,
    marginHorizontal: responsiveWidth(5),
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: colors.borderGray, // centralized color
    marginVertical: 10,
  },
  listContainer: {
    paddingBottom: responsiveHeight(10),
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.darkGray, // centralized color
    paddingVertical: 8,
  },
  areaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white, // centralized color
    padding: 15,
    marginHorizontal: responsiveWidth(5),
    marginVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderGray2, // centralized color
  },
  areaInfo: {
    flex: 1,
    marginRight: 10,
  },
  areaName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.darkGray, // centralized color
    marginBottom: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginTop: 8,
  },
  detailText: {
    fontSize: 14,
    color: colors.gray,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: responsiveHeight(15),
  },
  emptyImage: {
    width: width * 0.6,
    height: width * 0.6,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
    lineHeight: 24,
    textAlign: 'center',
    marginHorizontal: responsiveWidth(10),
  },
  loader: {
    marginTop: responsiveHeight(30),
  },
});

export default ServicesAvailableScreen;
