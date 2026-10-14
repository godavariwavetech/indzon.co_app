// src/redux/reducers/coupons.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { endpoints } from '../../config/config';
import api from '../../utils/api';

// Define the async thunk for fetching coupons
export const fetchCoupons = createAsyncThunk(
  'fetchCoupons',
  async (
    { shop_id, location_id,category_id },
    { getState, rejectWithValue, fulfillWithValue }
  ) => {
    try {
     console.log("coupon payload",{
      "shop_id": shop_id,
      "location_id": location_id,
      "coupon_category_id": category_id
    })
      
      // Validate required parameters
      if (!shop_id || !location_id) {
        return rejectWithValue('Shop ID and Location ID are required');
      }
      
      const response = await api.post(endpoints.GET_COUPONS, {
        "shop_id": shop_id,
        "location_id": location_id,
        "coupon_category_id": category_id
      })
      
      console.log("Response:", response)
      
      if (response && response.data) {
        return fulfillWithValue(response.data);
      } else {
        return rejectWithValue('No data received from server');
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
      
      // Handle different types of errors
      if (error.response) {
        // Server responded with error status
        const errorMessage = error.response.data?.message || 
                           error.response.data?.error || 
                           `Server error: ${error.response.status}`;
        return rejectWithValue(errorMessage);
      } else if (error.request) {
        // Network error
        return rejectWithValue('Network error: Please check your connection');
      } else {
        // Other errors
        return rejectWithValue(error.message || 'An unexpected error occurred');
      }
    }
  }
);

const initialState = {
  appliedCoupon: null,
  coupons: [], // New state to store the list of coupons
  loading: false, // Optional: to handle loading state
  error: null, // Optional: to handle error state
};

const couponSlice = createSlice({
  name: 'coupons',
  initialState,
  reducers: {
    applyCoupon: (state, action) => {
      state.appliedCoupon = action.payload;
    },
    removeCoupon: (state) => {
      state.appliedCoupon = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchCoupons.pending, (state) => {
      state.loading = true; // Set loading to true while fetching
    })
    builder.addCase(fetchCoupons.fulfilled, (state, action) => {
      state.loading = false; // Set loading to false on success
      state.coupons = action.payload.data;
    })
    builder.addCase(fetchCoupons.rejected, (state, action) => {
      state.loading = false; // Set loading to false on error
      state.error = action.error.message; // Store the error message
    });
  },
});

export const { applyCoupon, removeCoupon } = couponSlice.actions;
export default couponSlice.reducer;