import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import api from '../../utils/api';
import {endpoints} from '../../config/config';

const initialState = {
  message: null,
  loading: false,
  tourPackages:null,
  rentalItems:null,
  ordersList:null,
  rentalItemsLoading:false
};

export const getTourPackages = createAsyncThunk(
  "getTourPackages",
  async(
    _,
    {getState, rejectWithValue, fulfillWithValue}
  )=>{
    const response = await api.post(endpoints.TOUR_PACKAGES);
    if (response) {
      if (response.data) {
        return fulfillWithValue(response.data);
      } else {
        return rejectWithValue('Something went wrong!');
      }
    }
  }
)


export const getRentalItems = createAsyncThunk(
  "getRentalItems",
  async(
    _,
    {getState, rejectWithValue, fulfillWithValue}
  )=>{
    const response = await api.post(endpoints.GET_RENTAL_ITEMS);
    if (response) {
      if (response.data) {
        return fulfillWithValue(response.data);
      } else {
        return rejectWithValue('Something went wrong!');
      }
    }
  }
)


export const getAllOrders = createAsyncThunk(
  "getAllOrders",
  async(
    _,
    {getState, rejectWithValue, fulfillWithValue}
  )=>{
    const response = await api.post(endpoints.GET_ALL_ORDERS);
    if (response) {
      if (response.data) {
        return fulfillWithValue(response.data);
      } else {
        return rejectWithValue('Something went wrong!');
      }
    }
  }
)


export const userDahboard = createSlice({
  name: 'userDahboard',
  initialState,
  reducers: {

  },
  extraReducers: builder => {
    builder.addCase(getTourPackages.pending, (state, action) => {
         state.loading = true;
         state.message = null;
       });
       builder.addCase(getTourPackages.fulfilled, (state, action) => {
         state.loading = false;
         state.message = null;
         if(action.payload?.data?.data){
          state.tourPackages = action.payload?.data?.data
         }
       });
       builder.addCase(getTourPackages.rejected, (state, action) => {
         state.loading = false;
         state.message = 'Please try again!';
       });

       builder.addCase(getRentalItems.pending, (state, action) => {
        state.rentalItemsLoading = true;
        state.message = null;
      });
      builder.addCase(getRentalItems.fulfilled, (state, action) => {
        state.rentalItemsLoading = false;
        state.message = null;
        if(action.payload?.data?.data){
         state.rentalItems = action.payload?.data?.data
        }
      });
      builder.addCase(getRentalItems.rejected, (state, action) => {
        state.rentalItemsLoading = false;
        state.message = 'Please try again!';
      });

      builder.addCase(getAllOrders.pending, (state, action) => {
        state.loading = true;
        state.message = null;
      });
      builder.addCase(getAllOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.message = null;
        if(action.payload?.data?.data){
          state.ordersList= action.payload?.data?.data
        }
      });
      builder.addCase(getAllOrders.rejected, (state, action) => {
        state.loading = false;
        state.message = 'Please try again!';
      });
  },
});

export const {} = userDahboard.actions;

export default userDahboard.reducer;
