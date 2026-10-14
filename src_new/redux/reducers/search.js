// src/redux/reducers/coupons.js
import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {endpoints} from '../../config/config';
import api from '../../utils/api';

// Define the async thunk for fetching coupons
export const getSearchShopList = createAsyncThunk(
  'getSearchShopList',
  async ({tableName,searchText}, {getState, rejectWithValue, fulfillWithValue}) => {
    const {locationId} = getState().Auth;
   
    const response = await api.post(endpoints.GET_SEARCH_SHOP_LIST, {
        "table_name": tableName, 
        "search_text": searchText,
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

export const getSingleShopDetails = createAsyncThunk(
    'getSingleShopDetails',
    async ({shopId}, {getState, rejectWithValue, fulfillWithValue}) => {
      const {locationId,location} = getState().Auth;
     
      const response = await api.post(endpoints.GET_SINGLE_SHOP_DETAILS, {
        "shop_latitude": location.latitude,
        "shop_longitude": location.longitude,
        "location_id":locationId,
        "shop_id":shopId
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

  export const getSearchCategory = createAsyncThunk(
    'getSearchCategory',
    async ({tableName,searchId}, {getState, rejectWithValue, fulfillWithValue}) => {
      const {locationId} = getState().Auth;
      const response = await api.post(endpoints.GET_SEARCH_CATEGORIES, {
        "table_name":tableName ,
        "id": searchId,
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

  export const getSearchSubCategory = createAsyncThunk(
    'getSearchSubCategory',
    async ({tableName,searchId}, {getState, rejectWithValue, fulfillWithValue}) => {
      const {locationId} = getState().Auth;
      const response = await api.post(endpoints.GET_SEARCH_SUB_CATEGORIES, {
        "table_name":tableName ,
        "id": searchId,
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

const search = createSlice({
  name: 'search',
  initialState,
  reducers: {},
  extraReducers: builder => {
  
  },
});

export const {} = search.actions;
export default search.reducer;
