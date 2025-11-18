import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, RefreshControl, ActivityIndicator, SafeAreaView } from 'react-native';
import { useDispatch } from 'react-redux';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import { responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import { getNotifications } from '../../redux/reducers/reviews';
import { useFocusEffect } from '@react-navigation/native';
import commonStyles from '../../commonstyles/CommonStyles';
import StatusBarManager from '../../components/StatusBarManager';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const NotificationsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await dispatch(getNotifications());
      setNotifications(response.payload?.data);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    }
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        setLoading(true);
        try {
          const response = await dispatch(getNotifications());
          setNotifications(response.payload?.data);
        } catch (error) {
          console.error('Error fetching notifications:', error);
        }
        setLoading(false);
      };
      fetchData();
    }, [])
  );

  const renderItem = ({ item }) => (
    <View style={styles.notificationItem}>
      <View style={styles.notificationHeader}>
        <View style={styles.notificationIcon}>
          <FontAwesome6 name="bell" size={16} color="#fff" />
        </View>
        <Text style={styles.notificationTitle}>{item.notification_title}</Text>
      </View>
      <Text style={styles.notificationDescription}>{item.notification_description}</Text>
      {/* <Text style={styles.notificationTime}>2 hours ago</Text> */}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <FontAwesome6 name="arrow-left-long" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
      </View>

      <View style={styles.contentContainer}>
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={commonStyles.btn2Color} />
          </View>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <FontAwesome6
                  name="bell-slash"
                  size={40}
                  color="#ddd"
                  style={styles.emptyIcon}
                />
                <Text style={styles.emptyText}>
                  No notifications yet.{"\n"}
                  We'll notify you when something arrives!
                </Text>
              </View>
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[commonStyles.btn2Color]}
                tintColor={commonStyles.btn2Color}
              />
            }
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: commonStyles.btn2Color,
    flexDirection: "row",
    alignItems: "flex-end",
    paddingVertical: responsiveHeight(2),
    paddingHorizontal: responsiveWidth(5),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: responsiveHeight(2),
  },
  backButton: {
    width: responsiveWidth(7),
    alignItems: "center",
    justifyContent: "center",
    marginRight: responsiveWidth(2),
    color: '#fff'
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginLeft: responsiveWidth(2),
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 100
  },
  notificationItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: responsiveWidth(5),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationIcon: {
    backgroundColor: commonStyles.btn2Color,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d2d2d',
    flex: 1,
  },
  notificationDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
    alignSelf: 'flex-end',
  },
  emptyContainer: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  contentContainer: {
    flex: 1,
  },
});

export default NotificationsScreen; 