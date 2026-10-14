// src/redux/reducers/coupons.js
import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {endpoints} from '../../config/config';
import api from '../../utils/api';

// Define the async thunk for fetching coupons
export const cancelOrder = createAsyncThunk(
  'cancelOrder',
  async ({orderId}, {getState, rejectWithValue, fulfillWithValue}) => {
    const response = await api.post(endpoints.CANCEL_ORDER, {
      order_id: orderId,
    });
    if (response) {
      if (response.data) {
        return fulfillWithValue(response.data);
      } else {
        return rejectWithValue('Something went wrong!');
      }
    }
  },
);

export const submitReview = createAsyncThunk(
  'submitReview',
  async (
    {shopId,orderId, rating, comment},
    {getState, rejectWithValue, fulfillWithValue},
  ) => {
    const {customerId} = await getState().Auth;
    const response = await api.post(endpoints.GIVE_ORDER_RATING, {
      usr_id:customerId,
      shop_id: shopId,
      order_id: orderId,
      rating,
      comment
    });
    if (response) {
      if (response.data) {
        return fulfillWithValue(response.data);
      } else {
        return rejectWithValue('Something went wrong!');
      }
    }
  },
);


export const submitAppReview = createAsyncThunk(
    'submitAppReview',
    async (
      {rating, comment},
      {getState, rejectWithValue, fulfillWithValue},
    ) => {
       
      const {customerId} = await getState().Auth;
      const response = await api.post(endpoints.GIVE_APP_FEEDBACK, {
        usr_id:customerId,
        rating,
        comment,
      });
      if (response) {
        if (response.data) {
          return fulfillWithValue(response.data);
        } else {
          return rejectWithValue('Something went wrong!');
        }
      }
    },
  );


  export const getResultFullData = createAsyncThunk(
    'getResultFullData',
    async (
      {resultData},
      {getState, rejectWithValue, fulfillWithValue},
    ) => {
       
      const response = await api.post(endpoints.GET_RESULT_FULL_DATA,resultData);
      if (response) {
        if (response.data) {
          return fulfillWithValue(response.data);
        } else {
          return rejectWithValue('Something went wrong!');
        }
      }
    },
  );

  export const getNotifications = createAsyncThunk(
    'getNotifications',
    async (
      _,
      {getState, rejectWithValue, fulfillWithValue},
    ) => {
      const {locationId} = await getState().Auth;
      const response = await api.post(endpoints.GET_NOTIFICATIONS,{
        "location_id":locationId
    });
      if (response) {
        if (response.data) {
          return fulfillWithValue(response.data);
        } else {
          return rejectWithValue('Something went wrong!');
        }
      }
    },
  );

const initialState = {
  loading: false,
  message: null,
};

const reviews = createSlice({
  name: 'reviews',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder.addCase(cancelOrder.pending, state => {
      state.loading = true; // Set loading to true while fetching
    });
    builder.addCase(cancelOrder.fulfilled, (state, action) => {
      state.loading = false; // Set loading to false on success
      state.coupons = action.payload.data;
    });
    builder.addCase(cancelOrder.rejected, (state, action) => {
      state.loading = false; // Set loading to false on error
      state.error = action.error.message; // Store the error message
    });
    builder.addCase(submitReview.pending, state => {
      state.loading = true; // Set loading to true while fetching
    });
    builder.addCase(submitReview.fulfilled, (state, action) => {
      state.loading = false; 
      state.message = action.payload.message;
    }); 
    builder.addCase(submitReview.rejected, (state, action) => {
      state.loading = false; // Set loading to false on error
      state.error = action.error.message; // Store the error message
    });
    builder.addCase(submitAppReview.pending, state => {
      state.loading = true; // Set loading to true while fetching
    });
    builder.addCase(submitAppReview.fulfilled, (state, action) => {
      state.loading = false; 
      state.message = action.payload.message;
    }); 
    builder.addCase(submitAppReview.rejected, (state, action) => {
      state.loading = false; // Set loading to false on error
      state.error = action.error.message; // Store the error message
    });
  },
});

export const {} = reviews.actions;
export default reviews.reducer;
