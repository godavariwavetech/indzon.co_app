/* eslint-env jest */
import authService from '../services/authService';
import api from '../utils/api';
import {endpoints} from '../config/config';
import authReducer, {
  actionLogout,
  completeAuthentication,
} from '../redux/reducers/auth';

jest.mock('../utils/api', () => ({
  __esModule: true,
  default: {post: jest.fn()},
}));

beforeEach(() => jest.clearAllMocks());

test('invalid mobile numbers do not send an OTP request', async () => {
  await expect(authService.requestOtp('12345')).rejects.toThrow('valid');
  expect(api.post).not.toHaveBeenCalled();
});

test('request uses the Amaraa endpoint without exposing returned OTPs to screens', async () => {
  api.post.mockResolvedValue({
    data: {status: 200, loginotp: '1234', resend_after_seconds: 45},
  });
  await expect(authService.requestOtp('9876543210')).resolves.toEqual({
    resendAfterSeconds: 45,
  });
  expect(api.post).toHaveBeenCalledWith(endpoints.REQUEST_OTP, {
    customer_mobile_number: '9876543210',
  });
});

test('server rejection is shown as an error even when the HTTP request succeeds', async () => {
  api.post.mockResolvedValue({
    data: {status: false, message: 'Try again later'},
  });
  await expect(authService.requestOtp('9876543210')).rejects.toThrow(
    'Try again later',
  );
});

test('invalid OTP input does not call the server', async () => {
  await expect(authService.verifyOtp('9876543210', '12ab')).rejects.toThrow(
    'verification code',
  );
  expect(api.post).not.toHaveBeenCalled();
});

test('the OTP is verified by the server and its actual session is returned', async () => {
  api.post.mockResolvedValue({
    data: {status: 200, token: 'server-token', data: {customer_id: 42}},
  });
  await expect(authService.verifyOtp('9876543210', '1234')).resolves.toEqual({
    token: 'server-token',
    customerId: 42,
    mobileNumber: '9876543210',
  });
  expect(api.post).toHaveBeenCalledWith(endpoints.VERIFY_CUSTOMER_OTP, {
    customer_mobile_number: '9876543210',
    customer_otp: '1234',
  });
});

test('a verified customer ID is accepted without inventing an access token', async () => {
  api.post.mockResolvedValue({data: {status: 200, data: [{customer_id: 42}]}});
  await expect(authService.verifyOtp('9876543210', '1234')).resolves.toEqual({
    token: null,
    customerId: 42,
    mobileNumber: '9876543210',
  });
});

test('a response without session information does not sign a customer in', async () => {
  api.post.mockResolvedValue({data: {status: 200, data: {}}});
  await expect(authService.verifyOtp('9876543210', '1234')).rejects.toThrow(
    'Could not verify',
  );
});

test('rejecting an OTP cannot be overridden by customer information in the response', async () => {
  api.post.mockResolvedValue({
    data: {status: false, message: 'Incorrect code', data: {customer_id: 42}},
  });
  await expect(authService.verifyOtp('9876543210', '1234')).rejects.toThrow(
    'Incorrect code',
  );
});

test('new authentication replaces the previous customer session and logout clears it', () => {
  const previous = {
    ...authReducer(undefined, {type: 'init'}),
    profileData: {name: 'Previous customer'},
    location: {latitude: 1},
    token: 'old-token',
  };
  const signedIn = authReducer(
    previous,
    completeAuthentication({
      token: null,
      customerId: 42,
      mobileNumber: '9876543210',
    }),
  );
  expect(signedIn).toMatchObject({
    isLogged: true,
    token: null,
    customerId: 42,
    profileData: null,
    location: null,
  });
  const signedOut = authReducer(signedIn, actionLogout());
  expect(signedOut).toMatchObject({
    isLogged: false,
    token: null,
    customerId: null,
    mobileNumber: '',
  });
});
