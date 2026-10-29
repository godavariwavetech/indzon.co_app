// export const baseURL = "https://amaraa.co.in:2026/";
//2630
// export const baseURL = 'https://melocalapp.com:1035/';

// Local backend (XAMPP MySQL + node app.js on D:\client\indzon_backend\amaraa_backend)
// Android emulator: http://10.0.2.2:2406/
// iOS simulator / same machine: http://localhost:2406/
// Physical device on same Wi-Fi: http://<this machine's LAN IP>:2406/
// Live: https://api.indzon.godavariwave.com/
// export const baseURL = "http://192.168.0.129:2406/";
export const baseURL = "https://godavariwave.in:2410/";


export const endpoints = {
  VERIFY_MOBILE: 'customers/v1/loginCheck',
  LOGIN: 'customers/v1/otpAuth',
  SIGNUP: 'customers/v1/loginCheck',
  TOUR_PACKAGES: 'packages/v1/getAll',
  GET_RENTAL_ITEMS: "rentalItems/v1/getAll",
  GET_ALL_ORDERS: 'categories/v1/getAll',
  DADDY_GET_CATEGORIES: 'public_app/getlocationctgrylist',
  GET_SUB_CATEGORIES: 'public_app/getshopsubcategorylist',
  GET_BANNER: 'public_app/getbannerslist',
  GET_SHOPS: 'public_app/getshoplist',
  GET_ITEMS_LIST: "public_app/getitemslist",
  VERIFY_CUSTOMER_MOBILE: 'public_app/customerlogin', 
  VERIFY_CUSTOMER_OTP: 'public_app/customerlogin',
  GET_ORDERS: 'public_app/getorderlist',
  GET_ALL_CATEGORIES: 'public_app/getsubcategoryall',
  GET_ADDRESS_LIST: 'public_app/get_customer_delivery_address',
  SET_ADDRESS_LIST: 'public_app/post_customer_delivery_address',
  DELETE_ADDRESS_LIST: 'public_app/delete_customer_address',
  GET_ORDER_DETAILS: 'public_app/getorderdetails',
  CHECK_ADDRESS_EXISTENCE: 'public_app/getuserlocation',
  GET_SERVICES_LIST: 'public_app/getserviceslist',
  GET_COUPONS: 'public_app/coupon_list',
  PLACE_ORDER: 'public_app/orderplaced',
  GET_CHARGES_LIST: 'public_app/application_common_api',
  REQUEST_OTP: 'public_app/getuserloginotp',
  GLOBAL_SEARCH: 'public_app/search_allitems',
  GIVE_APP_FEEDBACK: 'public_app/postapprating',
  CANCEL_ORDER: 'public_app/cancleorder',
  GIVE_ORDER_RATING: "public_app/postorderrating",
  GENERATE_ORDER_ID: 'public_app/generateorderid',
  UPDATE_ORDER_STATUS: 'public_app/updatepaymetdetails',
  GET_RESULT_FULL_DATA: 'public_app/searchitemsfull',
  GET_NOTIFICATIONS: 'public_app/notificationslist',
  DELETE_ACCOUNT: 'public_app/deleteaccount',
  GET_SEARCH_SHOP_LIST: "public_app/getsearchshoplist",
  GET_SINGLE_SHOP_DETAILS: "public_app/getsingleshopdetails",
  GET_SEARCH_SUB_CATEGORIES: "public_app/getsearchsubcategoriesshoplist",
  GET_SEARCH_CATEGORIES: "public_app/getsearchcategoriesshoplist",
  UPDATE_CUSTOMER_PROFILE: 'public_app/update_customer_profile',
  GET_PROFILE: 'public_app/getprofile',
  ADD_WISHLIST: 'public_app/addwishlist',
  DELETE_WISHLIST: 'public_app/deletewishlist',
  GET_USER_WISHLIST: 'public_app/getuserwishlist',
};
