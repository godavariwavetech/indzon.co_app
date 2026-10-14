import { View, Text, StyleSheet, TouchableOpacity} from "react-native";
import React,{useState} from 'react'
import commonStyles from "../commonstyles/CommonStyles";
import Icon from "react-native-vector-icons/FontAwesome6"; 

const  SortButtons=({handleSorting})=>{
      
    const [sortOrder, setSortOrder] = useState("A-Z");
    const toggleSort = () => {
      const newSortOrder = sortOrder === "A-Z" ? "Z-A" : "A-Z" ;
      setSortOrder(newSortOrder);
      // handleSorting(newSortOrder)
    };
    // const handleSorting=()=>{}
    return(
      <View style={{alignSelf:'flex-end',marginBottom:16}}>
      <View style={styles.sortContainer}>
        <TouchableOpacity style={styles.button} onPress={()=>handleSorting(sortOrder)}>
          <Icon name="sliders" size={16} color={commonStyles.mainColor} />
          <Text style={[commonStyles.text3,{color:commonStyles.mainColor}]}>Sort by</Text>
        </TouchableOpacity>
  
        <TouchableOpacity style={styles.button} onPress={toggleSort}>
          <Icon name="sliders" size={16} color={commonStyles.mainColor} />
          <Text style={[commonStyles.text3,{color:commonStyles.mainColor}]}>{sortOrder}</Text>
        </TouchableOpacity>
      </View>
      </View>
    )
  }

  export default SortButtons;



  
const styles = StyleSheet.create({
    sortContainer: {
        flexDirection: "row",
        gap: 12,
        alignItems: "center",
    },
    button: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F8FAFC",
        paddingVertical: 5,
        paddingHorizontal: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: commonStyles.strokeLines,
        gap:6
    },
    buttonText: {
        color: "#2979FF",
        fontSize: 14,
        marginLeft: 6,
    },
})

