import {createSlice} from '@reduxjs/toolkit';
import {products} from '../../config/catalog';

const initialState = {
  cart: {},
  couponCode: null,
  wishlist: [],
  profileName: '',
  profileEmail: '',
  messages: [],
  orders: [],
  feedback: {},
};
const commerce = createSlice({
  name: 'commerce',
  initialState,
  reducers: {
    setCouponCode(state, {payload}) {
      state.couponCode = payload;
    },
    addItem(state, {payload}) {
      if (products.some(product => product.id === payload)) {
        state.cart[payload] = (state.cart[payload] || 0) + 1;
      }
    },
    removeItem(state, {payload}) {
      if (state.cart[payload] > 1) {
        state.cart[payload] -= 1;
      } else {
        delete state.cart[payload];
      }
    },
    deleteItem(state, {payload}) {
      delete state.cart[payload];
    },
    clearCart(state) {
      state.cart = {};
      state.couponCode = null;
    },
    placePreviewOrder(state, {payload}) {
      if (!Object.keys(state.cart).length || !payload.address) {
        return;
      }
      state.orders.unshift(payload);
      state.cart = {};
      state.couponCode = null;
    },
    saveOrderFeedback(state, {payload}) {
      state.feedback[payload.orderId] = {
        rating: payload.rating,
        text: payload.text,
      };
    },
    toggleWishlist(state, {payload}) {
      if (!products.some(product => product.id === payload)) {
        return;
      }
      if (state.wishlist.includes(payload)) {
        state.wishlist = state.wishlist.filter(id => id !== payload);
      } else {
        state.wishlist.push(payload);
      }
    },
    setProfileName(state, {payload}) {
      state.profileName = payload.trim();
    },
    setProfileDetails(state, {payload}) {
      state.profileName = payload.name.trim();
      state.profileEmail = payload.email.trim();
    },
    addSupportMessage(state, {payload}) {
      state.messages.push(payload.trim());
    },
    resetCommerce() {
      return initialState;
    },
  },
});
export const {
  setCouponCode,
  addItem,
  removeItem,
  deleteItem,
  clearCart,
  placePreviewOrder,
  saveOrderFeedback,
  toggleWishlist,
  setProfileName,
  setProfileDetails,
  addSupportMessage,
  resetCommerce,
} = commerce.actions;
export default commerce.reducer;
