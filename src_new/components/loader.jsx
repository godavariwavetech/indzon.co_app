import React from "react";
import { ActivityIndicator, View } from "react-native";
const Loader =({size="small",color="#2563EB"}) => {
    return(
        <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
           <ActivityIndicator size={size} color={color} />
        </View>
       
    )
}
export default Loader;