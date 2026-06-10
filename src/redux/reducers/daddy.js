import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';
import { endpoints } from '../../config/config';
import { resetCache } from '../../../metro.config';

const initialState = {
  message: null,
  loading: {
    categories: false,
    subCategories: false,
    banners: false,
    restaurants: false,
    itemsList: false,
    addressCheck: false,
  },
  token: null,
  userRole: 1,
  customerId: null,
  optCode: '',
  mobileNumber: '',
  isLogged: false,
  categories: null,
  subCategories: null,
  banners: null,
  restaurants: null,
  restaurantItems: null,
  itemsFilter: null,
  cartItems: [],
  activeCategoryIndex: 1,
  activeSubCategory: 0,
  totalPrice: 0,
  cartRestaurant: null,
  orders: null,
  allCategories: null,
  addressList: null,
  userAddress: null,
  serviceLocations: null,
  selectedServiceLocation: null,
  appliedCoupon: null,
  services: null,
  serviceAvailable: null,
  products: [],
  total: 0,
  checkoutStatus: null,
  homeRestaurnats: null
};

export const checkAddressExistence = createAsyncThunk(
  "checkAddressExistence",
  async (
    { latitude, longitude },
    { getState, rejectWithValue, fulfillWithValue }
  ) => {
    const data = {
      "location_latitude": latitude,
      "location_longitude": longitude
    }
    const response = await api.post(endpoints.CHECK_ADDRESS_EXISTENCE, data);
    if (response) {
      if (response.data) {
        return fulfillWithValue(response.data);
      } else {
        return rejectWithValue('Something went wrong!');
      }
    }
  }
)

export const getServicesList = createAsyncThunk(
  "getServicesList",
  async (
    { latitude, longitude },
    { getState, rejectWithValue, fulfillWithValue }
  ) => {
    const data = {
      "location_latitude": latitude,
      "location_longitude": longitude
    }
    const response = await api.post(endpoints.CHECK_ADDRESS_EXISTENCE, data);
    if (response) {
      if (response.data) {
        return fulfillWithValue(response.data);
      } else {
        return rejectWithValue('Something went wrong!');
      }
    }
  }
)

export const getServices = createAsyncThunk(
  "getServices",
  async (
    _,
    { getState, rejectWithValue, fulfillWithValue }
  ) => {
    const response = await api.get(endpoints.GET_SERVICES_LIST);
    console.log(response,">>>>>>>>>>>>>>RESPONSSSSSS SERVICES");
    if (response) {
      if (response.data) {
        return fulfillWithValue(response.data);
      } else {
        return rejectWithValue('Something went wrong!');
      }
    }
  }
)

export const getCategories = createAsyncThunk(
  "getCategories",
  async (
    _,
    { getState, rejectWithValue, fulfillWithValue }
  ) => {
    const { locationId } = getState().Auth;
    const response = await api.post(endpoints.DADDY_GET_CATEGORIES, {
      "location_id": locationId
    });
    if (response) {
      if (response.data) {
        return fulfillWithValue(response.data);
      } else {
        return rejectWithValue('Something went wrong!');
      }
    }
  }
)

export const getSubCategories = createAsyncThunk(
  "getSubCategories",
  async (
    { categoryId },
    { getState, rejectWithValue, fulfillWithValue }
  ) => {
    const { locationId } = getState().Auth;

    const data = {
      "category_id": categoryId,
      "location_id": locationId
    }
   
    const response = await api.post(endpoints.GET_SUB_CATEGORIES, data);
   
    if (response) {
      if (response.data) {
        return fulfillWithValue(response.data);
      } else {
        return rejectWithValue('Something went wrong!');
      }
    }
    else {
      return rejectWithValue('No sub categories found!');
    }

  }
)

export const getBanners = createAsyncThunk(
  "getBanners",
  async (
    _,
    { getState, rejectWithValue, fulfillWithValue }
  ) => {
    const { locationId } = getState().Auth;
    const response = await api.post(endpoints.GET_BANNER, {
      "location_id": locationId
    });

    if (response) {
      if (response.data) {
        return fulfillWithValue(response.data);
      } else {
        return rejectWithValue('Something went wrong!');
      }
    }
  }
)

export const getRestaurants = createAsyncThunk(
  "getRestaurants",
  async (
    { categoryId, subCatergoryId, shopId },
    { getState, rejectWithValue, fulfillWithValue }
  ) => {

    const { location, locationId } = getState().Auth;
    console.log("payload of shops liest ++++++++++++++++++++++++++++ ",{
      "shop_latitude": location.latitude,
      "shop_longitude": location.longitude,
      "location_id": locationId,
      "category_id": categoryId,
      "sub_category_id": subCatergoryId,
      "shop_id": shopId
    })
    const response = await api.post(endpoints.GET_SHOPS, {
      "shop_latitude": location.latitude,
      "shop_longitude": location.longitude,
      "location_id": locationId,
      "category_id": categoryId,
      "sub_category_id": subCatergoryId,
      "shop_id": shopId
    }) 
    console.log("response--------------------2222222222222222222222222222222222222222222222222222", response)
    if (response) {
      if (response.data) {
        return fulfillWithValue(response.data);
      } else {
        return rejectWithValue('Something went wrong!');
      }
    }
  }
)

export const getRestaurantsHome = createAsyncThunk(
  "getRestaurantsHome",
  async (
    { categoryId, subCatergoryId },
    { getState, rejectWithValue, fulfillWithValue }
  ) => {

    const { location, locationId } = getState().Auth;
   
    const response = await api.post(endpoints.GET_SHOPS, {
      "shop_latitude": location.latitude,
      "shop_longitude": location.longitude,
      "location_id": locationId,
      "category_id": categoryId,
      "sub_category_id": subCatergoryId || 0,
      "shop_id": 0
    })

    if (response) {
      if (response.data) {
        return fulfillWithValue(response.data);
      } else {
        return rejectWithValue('Something went wrong!');
      }
    }
  }
)

export const getItemsList = createAsyncThunk(
  "getItemsList",
  async (
    { shopId, shopItem },
    { getState, rejectWithValue, fulfillWithValue }
  ) => {
   
    const response = await api.post(endpoints.GET_ITEMS_LIST, {
      "shop_id": shopId,
      "shop_items_tb_nm": shopItem
    })
    if (response) {
      if (response.data) {
        return fulfillWithValue(response.data);
      } else {
        return rejectWithValue('Something went wrong!');
      }
    }
  }
)

export const getOrders = createAsyncThunk(
  "getOrders",
  async (
    { orderId },
    { getState, rejectWithValue, fulfillWithValue }
  ) => {
    const { customerId } = getState().Auth;
   
    const response = await api.post(endpoints.GET_ORDERS, {
      "customer_id": customerId,
      "order_id": orderId
    })
    if (response) {
      if (response.data) {
        return fulfillWithValue(response.data);
      } else {
        return rejectWithValue('Something went wrong!');
      }
    }
  }
)

export const getOrderDetails = createAsyncThunk(
  "getOrderDetails",
  async (
    { orderId },
    { getState, rejectWithValue, fulfillWithValue }
  ) => {
    const response = await api.post(endpoints.GET_ORDER_DETAILS, {
      "order_id": orderId
    })
    if (response) {
      if (response.data) {
        return fulfillWithValue(response.data);
      } else {
        return rejectWithValue('Something went wrong!');
      }
    }
  }
)

export const getAllCategories = createAsyncThunk(
  "getAllCategories",
  async (
    _,
    { getState, rejectWithValue, fulfillWithValue }
  ) => {
    const response = await api.post(endpoints.GET_ALL_CATEGORIES,{
          "veg_mode": 0
    })
    if (response) {
      if (response.data) {
        return fulfillWithValue(response.data);
      } else {
        return rejectWithValue('Something went wrong!');
      }
    }
  }
)

export const getAddressList = createAsyncThunk(
  "getAddressList",
  async (
    _,
    { getState, rejectWithValue, fulfillWithValue }
  ) => {
    const { customerId } = getState().Auth;
    const response = await api.post(endpoints.GET_ADDRESS_LIST, {
      "customer_id": customerId
    })
    if (response) {
      if (response.data) {
        return fulfillWithValue(response.data);
      } else {
        return rejectWithValue('Something went wrong!');
      }
    }
  }
)

export const setAddressList = createAsyncThunk(
  "setAddressList",
  async (
    { addressType, address, customer_latitude, customer_longitude, customer_name, customer_mobile_number, location_id, id, pincode, landmark, city, state },
    { getState, rejectWithValue, fulfillWithValue }
  ) => {
    const { customerId } = getState().Auth;
    const data = {
      "address_type": addressType,
      "full_address": address,
      "customer_latitude": customer_latitude,
      "customer_longitude": customer_longitude,
      "location_id": location_id,
      "customer_id": customerId,
      "customer_name": customer_name,
      "customer_mobile_number": customer_mobile_number
    }
    
    // Include id for updates - API might expect number or string
    if (id) {
      // Try both number and string format to ensure API recognizes it
      data.id = typeof id === 'number' ? id : Number(id) || id;
      console.log('Updating address - ID type:', typeof data.id, 'Value:', data.id);
      console.log('Full data being sent to API:', JSON.stringify(data, null, 2));
    } else {
      console.log('Creating new address (no ID provided)');
    }
    
    // Include optional address details if provided
    if (pincode) {
      data.pincode = pincode;
    }
    if (landmark) {
      data.landmark = landmark;
    }
    if (city) {
      data.city = city;
    }
    if (state) {
      data.state = state;
    }
    
    const response = await api.post(endpoints.SET_ADDRESS_LIST, data)
    if (response) {
      if (response.data) {
        return fulfillWithValue(response.data);
      } else {
        return rejectWithValue('Something went wrong!');
      }
    }
  }
)

export const deleteAddress = createAsyncThunk(
  "deleteAddress",
  async (
    { addressId },
    { getState, rejectWithValue, fulfillWithValue }
  ) => {
    const { customerId } = getState().Auth;

    const data = {
      "customer_id": customerId,
      "id": addressId
    }
    const response = await api.post(endpoints.DELETE_ADDRESS_LIST, data)
    if (response) {
      if (response.data) {
        return fulfillWithValue(response.data);
      } else {
        return rejectWithValue('Something went wrong!');
      }
    }
  }
)


export const placeOrder = createAsyncThunk(
  "placeOrder",
  async (
    { orderDetails },
    { getState, rejectWithValue, fulfillWithValue }
  ) => {
    const response = await api.post(endpoints.PLACE_ORDER, orderDetails)
    if (response) {
      if (response.data) {
        return fulfillWithValue(response.data);
      } else {
        return rejectWithValue('Something went wrong!');
      }
    }
  }
)

export const generateOrderId = createAsyncThunk(
  "generateOrderId",
  async ({ orderAmount }, { rejectWithValue }) => {
    try {
      const response = await api.post(endpoints.GENERATE_ORDER_ID, {
        order_amount: Number(orderAmount)  
      });

      if (response?.data) {
        
        return response.data.orderId; // This will have order_id
      } else {
        return rejectWithValue("Something went wrong!");
      }
    } catch (error) {
      return rejectWithValue(error.response?.data || "API Error");
    }
  }
);


export const  updateOrderStatus = createAsyncThunk(
  "updateOrderStatus",
  async (
    { paymentId, rzpId, orderId ,customer_id },
    { getState, rejectWithValue, fulfillWithValue }
  ) => {
    const response = await api.post(endpoints.UPDATE_ORDER_STATUS, {
      "payment_id": paymentId,
      "razorpay_order_id": rzpId,
      "id": orderId,
      "customer_id": customer_id
    })
  
    if (response) {
      if (response.data) {
        return fulfillWithValue(response.data);
      } else {
        return rejectWithValue('Something went wrong!');
      }
    }
  }
)


export const checkServiceAvailability = createAsyncThunk(
  'dashboard/checkServiceAvailability',
  async (coordinates, { rejectWithValue }) => {
    try {
      const response = await api.post('/check-service', coordinates);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const getAvailableAreas = createAsyncThunk(
  'dashboard/getAvailableAreas',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/service-areas');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateUserLocation = createAsyncThunk(
  'dashboard/updateUserLocation',
  async (area, { rejectWithValue }) => {
    try {
      const response = await api.post('/update-location', area);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const Dashboard = createSlice({
  name: 'Dashboard',
  initialState,
  reducers: {
    updatecartItems: (state, action) => {

    },
    setActiveCategoryIndex: (state, action) => {
      state.activeCategoryIndex = action.payload
    },
    addToCart: (state, action) => {
      const { id, shop_id, selling_price, actualitem_price } = action.payload;
      
      if (state.cartItems.length === 0) {
        state.cartRestaurant = shop_id;
      }

      const itemIndex = state.cartItems.findIndex(item => item.id === id);

      if (itemIndex >= 0) {
        state.cartItems[itemIndex].quantity += 1;
      } else {
        state.cartItems.push({ ...action.payload, quantity: 1 });
      }

      state.totalPrice = state.cartItems.reduce((total, item) =>
        total + (Number(item.selling_price || item.actualitem_price || 0) * Number(item.quantity)), 0
      );
    },
    removeFromCart: (state, action) => {
      const { id } = action.payload;
      const itemIndex = state.cartItems.findIndex(item => item.id === id);
      
      if (itemIndex >= 0) {
        if (state.cartItems[itemIndex].quantity > 1) {
          state.cartItems[itemIndex].quantity -= 1;
        } else {
          state.cartItems = state.cartItems.filter((_, index) => index !== itemIndex);
        }
      }
      
      state.totalPrice = state.cartItems.reduce((total, item) =>
        total + (Number(item.selling_price || item.actualitem_price || 0) * Number(item.quantity)), 0
      );
    },

    setCartRestaurant: (state, action) => {
      state.cartItems = [];
      state.cartRestaurant = action.payload;
      state.totalPrice = 0;
    },

    clearCart: (state, action) => {
      state.cartItems = [];
    },
    setsubCategory: (state, action) => {
      state.activeSubCategory = action.payload
    },
    updateUserAddress: (state, action) => {
      state.userAddress = action.payload
    },
    setServiceLocations: (state, action) => {
      state.serviceLocations = action.payload;
    },
    setSelectedServiceLocation: (state, action) => {
      state.selectedServiceLocation = action.payload;
    },
    applyCoupon: (state, action) => {
      state.appliedCoupon = action.payload;
    },
    removeCoupon: (state) => {
      state.appliedCoupon = null;
    },

  },
  extraReducers: builder => {

    builder.addCase(checkAddressExistence.pending, (state) => {
      state.loading.addressCheck = true;
    });
    builder.addCase(checkAddressExistence.fulfilled, (state, action) => {
      state.loading.addressCheck = false;
      state.message = null;
      state.serviceAvailable = action.payload.data.length > 0;
      if (!action.payload.data.service_available) {
        state.serviceLocations = action.payload.data.available_locations;
      }
    });
    builder.addCase(checkAddressExistence.rejected, (state) => {
      state.loading.addressCheck = false;
    });

    builder.addCase(getCategories.pending, (state, action) => {
      state.loading.categories = true;
      state.message = null;
    });
    builder.addCase(getCategories.fulfilled, (state, action) => {
      state.loading.categories = false;
      state.message = null;
      state.categories = action.payload.data;
    });
    builder.addCase(getCategories.rejected, (state, action) => {
      state.loading.categories = false;
      state.message = 'Please try again!';
    });


    builder.addCase(getSubCategories.pending, (state, action) => {
      state.loading.subCategories = true;
      state.message = null;
    });
    builder.addCase(getSubCategories.fulfilled, (state, action) => {
      state.loading.subCategories = false;
      state.message = null;
      state.subCategories = action.payload.data;
    });
    builder.addCase(getSubCategories.rejected, (state, action) => {
      state.loading.subCategories = false;
      state.message = 'Please try again!';
    });

    builder.addCase(getBanners.pending, (state, action) => {
      state.loading.banners = true;
      state.message = null;
    });
    builder.addCase(getBanners.fulfilled, (state, action) => {
      state.loading.banners = false;
      state.message = null;
      state.banners = action.payload.data;
    });
    builder.addCase(getBanners.rejected, (state, action) => {
      state.loading.banners = false;
      state.message = 'Please try again!';
    });

    builder.addCase(getRestaurants.pending, (state, action) => {
      state.loading.restaurants = true;
      state.message = null;
      state.restaurants = [];
    });
    builder.addCase(getRestaurants.fulfilled, (state, action) => {
      state.loading.restaurants = false;
      state.message = null;
      state.restaurants = action.payload.data[0];
      console.log("restaurants--------------------",state.restaurants)
      state.itemsFilter = action.payload.data[1];
    });
    builder.addCase(getRestaurants.rejected, (state, action) => {
      state.loading.restaurants = false;
      state.message = 'Please try again!';
    });

    builder.addCase(getItemsList.pending, (state, action) => {
      state.loading.itemsList = true;
      state.message = null;
      state.restaurants = [];
    });
    builder.addCase(getItemsList.fulfilled, (state, action) => {
      state.loading.itemsList = false;
      state.message = null;
      state.restaurantItems = action.payload.data;
    });
    builder.addCase(getItemsList.rejected, (state, action) => {
      state.loading.itemsList = false;
      state.message = 'Please try again!';
    });


    builder.addCase(getOrders.pending, (state, action) => {
      state.loading.itemsList = true;
      state.message = null;
      // state.restaurants = [];
    });
    builder.addCase(getOrders.fulfilled, (state, action) => {
      state.loading.itemsList = false;
      state.message = null;
      state.orders = action.payload.data;
    });
    builder.addCase(getOrders.rejected, (state, action) => {
      state.loading.itemsList = false;
      state.message = 'Please try again!';
    });

    builder.addCase(getOrderDetails.pending, (state, action) => {
      state.loading.itemsList = true;
      state.message = null;
      // state.restaurants = [];
    });
    builder.addCase(getOrderDetails.fulfilled, (state, action) => {
      state.loading.itemsList = false;
      state.message = null;

    });
    builder.addCase(getOrderDetails.rejected, (state, action) => {
      state.loading.itemsList = false;
      state.message = 'Please try again!';
    });

    builder.addCase(getAllCategories.pending, (state, action) => {
      // state.loading.itemsList = true;
      state.message = null;
      // state.restaurants = [];
    });
    builder.addCase(getAllCategories.fulfilled, (state, action) => {
      // state.loading.itemsList = false;
      state.message = null;
      state.allCategories = action.payload.data

    });
    builder.addCase(getAllCategories.rejected, (state, action) => {
      state.loading.itemsList = false;
      state.message = 'Please try again!';
    });

    builder.addCase(getAddressList.pending, (state, action) => {
      state.loading = true;
      state.message = null;
    });
    builder.addCase(getAddressList.fulfilled, (state, action) => {
      state.loading = false;
      state.message = null;
      state.addressList = action.payload.data
    });
    builder.addCase(getAddressList.rejected, (state, action) => {
      state.loading = false;
      state.message = 'Please try again!';
    });

    builder.addCase(setAddressList.pending, (state, action) => {
      state.loading = true;
      state.message = null;
    });
    builder.addCase(setAddressList.fulfilled, (state, action) => {
      state.loading = false;
      state.message = null;
    });
    builder.addCase(setAddressList.rejected, (state, action) => {
      state.loading = false;
      state.message = 'Please try again!';
    });

    builder.addCase(placeOrder.pending, (state, action) => {
      state.loading = true;
      state.message = null;
    });
    builder.addCase(placeOrder.fulfilled, (state, action) => {
      state.loading = false;
      state.message = null;
    });
    builder.addCase(placeOrder.rejected, (state, action) => {
      state.loading = false;
      state.message = 'Please try again!';
    });

    builder.addCase(checkServiceAvailability.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(checkServiceAvailability.fulfilled, (state, action) => {
      state.loading = false;
      state.serviceAvailable = action.payload.available;
    });
    builder.addCase(checkServiceAvailability.rejected, (state) => {
      state.loading = false;
    });

    builder.addCase(getAvailableAreas.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(getAvailableAreas.fulfilled, (state, action) => {
      state.loading = false;
      state.availableAreas = action.payload;
    });
    builder.addCase(getAvailableAreas.rejected, (state) => {
      state.loading = false;
    });

    builder.addCase(updateUserLocation.fulfilled, (state, action) => {
      state.userAddress = action.payload;
    });

    builder.addCase(getServices.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(getServices.fulfilled, (state, action) => {
      state.loading = false;
      state.availableAreas = action.payload.data;
    });
    builder.addCase(getServices.rejected, (state) => {
      state.loading = false;
    });

    builder.addCase(getRestaurantsHome.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(getRestaurantsHome.fulfilled, (state, action) => {
      state.loading = false;
      state.homeRestaurnats = action.payload.data[0];
    });
    builder.addCase(getRestaurantsHome.rejected, (state) => {
      state.loading = false;
    });
  },
});


export const {
  updatecartItems,
  setActiveCategoryIndex,
  addToCart,
  removeFromCart,
  setCartRestaurant,
  clearCart,
  setsubCategory,
  updateUserAddress,
  setServiceLocations,
  setSelectedServiceLocation,
  applyCoupon,
  removeCoupon
} = Dashboard.actions;

export default Dashboard.reducer;


