import { StyleSheet, Text, View } from 'react-native'
import React from 'react';
import Icon from 'react-native-vector-icons/FontAwesome';

const StarRating = ({ rating, width, gap }) => {
    const maxStars = 5;
  
    return (
      <View style={{ flexDirection: 'row',gap:gap }}>
        {[...Array(maxStars)].map((_, index) => {
          let iconName = 'star-o';  // Default empty star
          let color = 'gray';       // Gray color for empty stars
  
          if (index < Math.floor(rating)) {
            iconName = 'star';   // Full star
            color = '#FFD700';   // Gold color for full stars
          } else if (index < rating) {
            iconName = 'star-half-o';  // Half star
            color = '#FFD700';         // Gold color for half stars
          }
  
          return <Icon key={index} name={iconName} size={width} color={color} />;
        })}
      </View>
    );
  };

export default StarRating

const styles = StyleSheet.create({})