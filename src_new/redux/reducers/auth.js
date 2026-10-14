import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import api from '../../utils/api';
import {endpoints} from '../../config/config';

const initialState = {
  message: null,
  loading: false,
  token: null,
  userRole: 1,
  optCode: '',
  mobileNumber: '',
  isLogged: false,
  customerId: null,
  location: null,
  locationName: null,
  locationId: null,
  deliveryAddress: null,
  shouldNavigate: false,
  orderOfferAmount: 0,
  reaturantDetails: null,
  profileData: null, // Added to store profile response
};

export const verifyMobile = createAsyncThunk(
  'verifyMobile',
  async ({mobileNumber}, {getState, rejectWithValue, fulfillWithValue}) => {
    const data = {
      mobile: mobileNumber,
    };
    const response = {
      data: {data: [{}], status: true},
    };
    if (response) {
      if (response.data) {
        return fulfillWithValue(response.data);
      } else {
        return rejectWithValue('Something went wrong!');
      }
    }
  },
);

export const addCustomer = createAsyncThunk(
  'addCustomer',
  async (
    { mobileNumber, otp },
    { getState, rejectWithValue, fulfillWithValue }
  ) => {
    try {
      const data = {
        customer_mobile_number: mobileNumber,
        customer_otp: otp,
      };
      const response = await api.post(endpoints.VERIFY_CUSTOMER_OTP, data);
      if (response?.data) {
        return fulfillWithValue(response.data);
      } else {
        return rejectWithValue('Invalid server response');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Network or server error');
    }
  }
);


export const loginAction = createAsyncThunk(
  'loginAction',
  async ({enteredOtp}, {getState, rejectWithValue, fulfillWithValue}) => {
    const {mobileNumber} = getState().Auth;
    const data = {
      mobile: mobileNumber,
      otp: enteredOtp,
    };
    const response = await api.post(endpoints.LOGIN, data);
    if (response) {
      if (response.data) {
        return fulfillWithValue(response.data);
      } else {
        return rejectWithValue('Something went wrong!');
      }
    }
  },
);

export const verifyCustomerMobile = createAsyncThunk(
  'verifyCustomerMobile',
  async (
    {customer_mobile_number},
    {getState, rejectWithValue, fulfillWithValue},
  ) => {
    const data = {
      "customer_mobile_number":customer_mobile_number,
    }; 
    try {
      console.log("response of REQUEST_OTP 4")
      const response = await api.post(endpoints.REQUEST_OTP, data);
    
      if (response?.data) {
        return fulfillWithValue(response.data);
      } else {
        return rejectWithValue('Something went wrong!');
      }
    } catch (error) {
      console.log("error of REQUEST_OTP 5", error)
      return rejectWithValue(error.message || 'Something went wrong!');
    }
  },
);

export const verifyCustomerOTP = createAsyncThunk(
  'verifyCustomerOTP',
  async (
    {customer_mobile_number, customer_otp},
    {getState, rejectWithValue, fulfillWithValue},
  ) => {
    const data = {
      customer_mobile_number,
      customer_otp,
    };
    try {
      const response = await api.post(endpoints.VERIFY_CUSTOMER_OTP, data);
      if (response?.data) {
        return fulfillWithValue(response.data);
      } else {
        return rejectWithValue('Something went wrong!');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Something went wrong!');
    }
  },
);

export const deleteAccount = createAsyncThunk(
  'deleteAccount',
  async (_, {getState, rejectWithValue, fulfillWithValue}) => {
    const {customerId} = getState().Auth;
    const response = await api.post(endpoints.DELETE_ACCOUNT, {
        "user_id":customerId
    });
    const deletionResponse = response?.data;
    const deletionStatus = deletionResponse?.status;
    const requestSucceeded =
      deletionResponse &&
      deletionResponse.success !== false &&
      deletionStatus !== false &&
      (deletionStatus == null || deletionStatus === 200 || deletionStatus === '200' || deletionStatus === true);
    if (requestSucceeded) {
      return fulfillWithValue(deletionResponse);
    }
    return rejectWithValue(deletionResponse?.message || 'Something went wrong!');
  },
);

export const updateCustomerProfile = createAsyncThunk(
  'updateCustomerProfile',
  async (payload, {rejectWithValue, fulfillWithValue}) => {
    try {
      const response = await api.post(endpoints.UPDATE_CUSTOMER_PROFILE, payload);
      if (response?.data) {
        return fulfillWithValue(response.data);
      } else {
        return rejectWithValue('Something went wrong!');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Something went wrong!');
    }
  },
);

// NEW THUNK: Fetch Customer Profile
export const getCustomerProfile = createAsyncThunk(
  'getCustomerProfile',
  async ({ customer_id }, { rejectWithValue, fulfillWithValue }) => {
    try {
      const response = await api.post(endpoints.GET_PROFILE || '/public_app/getprofile', { customer_id });
      if (response?.data) {
        return fulfillWithValue(response.data);
      } else {
        return rejectWithValue('Something went wrong!');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Something went wrong!');
    }
  },
);

export const AuthSlice = createSlice({
  name: 'authlice',
  initialState,
  reducers: {
    actionLogout: state => {
      Object.assign(state, initialState);
    },
    completeAuthentication: (state, action) => {
      Object.assign(state, initialState, action.payload, {isLogged: true});
    },
    setDeliveryAddress: (state, action) => {
      const address = action.payload;
      state.deliveryAddress = address;
      if (!address) {
        state.location = null;
        state.locationName = null;
        state.locationId = null;
        return;
      }
      state.location = {
        latitude: Number(address.customer_latitude),
        longitude: Number(address.customer_longitude),
      };
      state.locationName = address.location_name;
      state.locationId = address.location_id;
    },
    actionLogin: state => {
      state.token = 'sample token';
    },
    setMobile: (state, action) => {
      state.mobileNumber = action.payload;
    },
    setInitial: state => {
      (state.loading = false), (state.message = null);
    },
    setLocation: (state, action) => {
      state.location = action.payload;
    },
    setLocationName: (state, action) => {
      state.locationName = action.payload;
    },
    setLocationId: (state, action) => {
      state.locationId = action.payload;
    },
    setRestaurnatDetails: (state, action) => {
      state.reaturantDetails = action.payload;
    },
    clearNavigationFlag: state => {
      state.shouldNavigate = false;
    },
    setOrderOfferAmount: (state, action) => {
      state.orderOfferAmount = action.payload;
    },
  },
  extraReducers: builder => {
    builder.addCase(loginAction.pending, (state, action) => {
      state.loading = true;
      state.message = null;
    });
    builder.addCase(loginAction.fulfilled, (state, action) => {
      state.loading = false;
      state.message = null;
      if (action.payload.token) {
        state.token = action.payload.token;
        state.isLogged = true;
        state.shouldNavigate = true;
      }
    });
    builder.addCase(loginAction.rejected, (state, action) => {
      state.loading = false;
      state.message = 'Please try again!';
    });

    builder.addCase(verifyMobile.pending, (state, action) => {
      state.loading = true;
      state.message = null;
    });
    builder.addCase(verifyMobile.fulfilled, (state, action) => {
      state.loading = false;
      state.message = null;
      if (action.payload?.data[0]?.mobile) {
        state.mobileNumber = action.payload?.data[0]?.mobile;
      }
    });
    builder.addCase(verifyMobile.rejected, (state, action) => {
      state.loading = false;
      state.message = 'Please try again!';
    });

    // Customer Mobile Verification
    builder.addCase(verifyCustomerMobile.pending, (state, action) => {
      state.loading = true;
      state.message = null;
    });
    builder.addCase(verifyCustomerMobile.fulfilled, (state, action) => {
      state.loading = false;
      state.message = null;
    });
    builder.addCase(verifyCustomerMobile.rejected, (state, action) => {
      state.loading = false;
      state.message = action.payload || 'Please try again!';
    });

    // Customer OTP Verification
    builder.addCase(verifyCustomerOTP.pending, (state, action) => {
      state.loading = true;
      state.message = null;
    });
    builder.addCase(verifyCustomerOTP.fulfilled, (state, action) => {
      state.loading = false;
      state.message = null;
      if (action.payload?.token) {
        state.token = action.payload.token;
        state.isLogged = true;
      }
    });
    builder.addCase(verifyCustomerOTP.rejected, (state, action) => {
      state.loading = false;
      state.message = action.payload || 'Please try again!';
    });

    builder.addCase(addCustomer.pending, (state, action) => {
      state.loading = true;
      state.message = null;
    });
    builder.addCase(addCustomer.fulfilled, (state, action) => {
      state.loading = false;
      state.message = null;
      state.customerId = action.payload.data.customer_id;
    });
    builder.addCase(addCustomer.rejected, (state, action) => {
      state.loading = false;
      state.message = 'Please try again!';
    });

    // Update Profile
    builder.addCase(updateCustomerProfile.pending, (state, action) => {
      state.loading = true;
      state.message = null;
    });
    builder.addCase(updateCustomerProfile.fulfilled, (state, action) => {
      state.loading = false;
      state.message = null;
    });
    builder.addCase(updateCustomerProfile.rejected, (state, action) => {
      state.loading = false;
      state.message = action.payload || 'Failed to update profile';
    });

    // Get Profile
    builder.addCase(getCustomerProfile.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(getCustomerProfile.fulfilled, (state, action) => {
      state.loading = false;
      if (action.payload?.status === 200 && action.payload?.data?.length > 0) {
        state.profileData = action.payload.data[0];
      }
    });
    builder.addCase(getCustomerProfile.rejected, (state) => {
      state.loading = false;
    });
  },
});

export const {
  actionLogout,
  completeAuthentication,
  setDeliveryAddress,
  actionLogin,
  setMobile,
  setInitial,
  setLocation,
  setLocationName,
  setLocationId,
  clearNavigationFlag,
  setRestaurnatDetails,
  setOrderOfferAmount,
} = AuthSlice.actions;

export default AuthSlice.reducer;
