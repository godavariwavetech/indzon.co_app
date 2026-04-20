import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, StatusBar } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useDispatch } from 'react-redux';
import { submitAppReview } from '../../redux/reducers/reviews';
import CustomModal from '../../components/CustomModal';
import commonStyles from '../../commonstyles/CommonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FeedbackScreen = ({ navigation }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const handleSubmit = async () => {
    try {
      await dispatch(submitAppReview({rating, comment}));
      setShowSuccessModal(true);
    } catch (error) {
      // Handle error
    }
  };

  return (
    <View style={styles.container}>
      {/* <StatusBar backgroundColor={commonStyles.btn2Color} barStyle={'light-content'} /> */}
      <LinearGradient colors={['#D14A00', '#6C2600']} style={[styles.gradientContainer, { paddingTop: insets.top }]}>
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <FontAwesome6 name="arrow-left-long" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Feedback</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={styles.title}>How was your experience?</Text>
        
        <View style={styles.ratingContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setRating(star)}
              style={styles.starButton}>
              <MaterialIcons
                name={star <= rating ? "star" : "star-border"}
                size={40}
                color="#FFD700"
              />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Tell us more (optional)</Text>
        <TextInput
          style={styles.input}
          multiline
          numberOfLines={4}
          placeholder="Share your experience with us..."
          value={comment}
          onChangeText={setComment}
          placeholderTextColor="#666"
          selectionColor={commonStyles.appMainColor}
        />

        <TouchableOpacity 
          style={[styles.submitButton, rating === 0 && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={rating === 0}>
          <Text style={styles.submitButtonText}>Submit Feedback</Text>
        </TouchableOpacity>
      </View>

      <CustomModal
        visible={showSuccessModal}
        title="Thank You!"
        message="Your feedback has been submitted successfully."
        confirmText="OK"
        onConfirm={() => {
          setShowSuccessModal(false);
          navigation.goBack();
        }}
        showCancel={false}
        cancelText=''
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  gradientContainer: {
   paddingVertical: responsiveHeight(3),
   borderBottomLeftRadius:16,
   borderBottomRightRadius:16
  //  paddingTop: 40
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveWidth(5),
    // paddingBottom: responsiveHeight(3),
    paddingTop:responsiveHeight(1)
  },
  backButton: {
    marginRight: responsiveWidth(5),
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: responsiveWidth(5),
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: responsiveHeight(3),
    textAlign: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsiveHeight(4),
  },
  starButton: {
    padding: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: '#000',
    textAlignVertical: 'top',
    height: responsiveHeight(20),
    marginBottom: responsiveHeight(3),
    borderWidth:0.5
  },
  submitButton: {
    backgroundColor: commonStyles.appMainColor,
    borderRadius: 8,
    padding: responsiveHeight(1.5),
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default FeedbackScreen; 