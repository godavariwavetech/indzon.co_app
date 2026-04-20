import { Pressable, StyleSheet, View } from "react-native";
// import BookingsScreen from "../screens/user/BookingsScreen";
// import HomeScreen from "../screens/user/HomeScreen";
// import ProfileScreen from "../screens/user/ProfileScreen";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import commonStyles from "../commonstyles/CommonStyles";
import Feather from "react-native-vector-icons/Feather";
import Entypo from "react-native-vector-icons/Entypo";
import FontAwesome from "react-native-vector-icons/FontAwesome";
// import UserHome from "../screens/UserHome";

// import commonStyles from "../commonstyles/CommonStyles";
import HomeScreen from "../screens/freelancer/HomeScreen";
import BookingsScreen from "../screens/freelancer/BookingsScreen";
import ItinerariesScreen from "../screens/freelancer/ItinerariesScreen";
import ProfileScreen from "../screens/freelancer/ProfileScreen";

const Tab = createBottomTabNavigator();


const FreelancerTabNavigator=()=>{
    return(
      // <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
        
            tabBarPressColor: "transparent", // Removes ripple effect
            tabBarPressOpacity: 1, // Ensures no dimming effect
            tabBarButton: (props) => (
                <Pressable
                  {...props}
                  android_ripple={null} // Disable ripple effect on Android
                  style={({ pressed }) => [
                    props.style,
                    { opacity: pressed ? 1 : 1 }, // Set opacity to 1 to remove the press effect
                  ]}
                />
              ),
          tabBarIcon: ({ color, size , focused }) => {
            let iconName;
            let IconComponent;
  
            if (route.name === "Home") {
              iconName='home';
              IconComponent = Entypo;
            } else if (route.name === "Itineraries") {
                iconName='calendar-check-o';
                IconComponent = FontAwesome;
              // return <Entypo name='home' size={size} color={color} />
            } else if (route.name === "Bookings") {
              iconName='calendar-check-o';
              IconComponent = FontAwesome;
              // return <FontAwesome name='calendar-check-o' size={size} color={color} />
            } else if (route.name === "Profile") {
              iconName='user';
              IconComponent = Feather;
              // return <Feather name='user' size={size} color={color} />
            }
  
            return (
              <View style={{alignItems:'center'}}>
                {focused && <View style={styles.activeTabLine} />}
                <IconComponent name={iconName} size={size} color={color} />
              </View>
            ) 
            // return <Icon name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: commonStyles.appMainColor,
          tabBarInactiveTintColor: "#64748B",
          tabBarStyle: { backgroundColor: "#fff", paddingBottom: 5, height: 60 ,borderTopWidth:1,borderColor:commonStyles.mainColor},
          tabBarLabelStyle: { fontSize: 12,fontWeight:400,marginTop:4 },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen}  options={{headerShown:false}} />
        <Tab.Screen name="Itineraries" component={ItinerariesScreen} options={{headerShown:false}} />
        <Tab.Screen name="Bookings" component={BookingsScreen} options={{headerShown:false}} />
        <Tab.Screen name="Profile" component={ProfileScreen}  options={{headerShown:false}} />
      </Tab.Navigator>
    // </NavigationContainer>
    )
  }


  export default FreelancerTabNavigator;

  const styles = StyleSheet.create({
    activeTabLine: {
      width: 30,
      height: 3,
      backgroundColor: "#2962ff",
      borderBottomLeftRadius:5,
      borderBottomRightRadius:5,
      marginBottom:10,
      position:"absolute",
      top:-8
    },
  })