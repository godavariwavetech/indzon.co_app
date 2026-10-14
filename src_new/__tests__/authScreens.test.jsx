/* eslint-env jest */
import React from 'react';
import {act, create} from 'react-test-renderer';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import LoginScreen from '../screens/auth/LoginScreen';
import OtpVerificationScreen from '../screens/auth/OtpVerificationScreen';
import authReducer from '../redux/reducers/auth';
import authService from '../services/authService';

jest.mock(
  '../components/auth/AuthScreenLayout',
  () =>
    ({children}) =>
      children,
);
jest.mock('../services/authService', () => ({
  __esModule: true,
  default: {requestOtp: jest.fn(), verifyOtp: jest.fn()},
}));
jest.mock('../utils/api', () => ({
  __esModule: true,
  default: {post: jest.fn()},
}));

const renderers = [];
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks();
});
afterEach(() => {
  act(() => renderers.splice(0).forEach(renderer => renderer.unmount()));
  jest.useRealTimers();
});

function renderScreen(Component, params = {}) {
  const store = configureStore({reducer: {Auth: authReducer}});
  const navigation = {navigate: jest.fn(), replace: jest.fn()};
  let renderer;
  act(() => {
    renderer = create(
      <Provider store={store}>
        <Component navigation={navigation} route={{params}} />
      </Provider>,
    );
  });
  renderers.push(renderer);
  return {renderer, navigation, store};
}

test('login rejects an incomplete number without navigating or requesting OTP', async () => {
  const {renderer, navigation} = renderScreen(LoginScreen);
  await act(async () => {
    await renderer.root
      .findByProps({testID: 'login-request-otp'})
      .props.onPress();
  });
  expect(authService.requestOtp).not.toHaveBeenCalled();
  expect(navigation.navigate).not.toHaveBeenCalled();
  expect(
    renderer.root.findAllByProps({accessibilityRole: 'alert'}).length,
  ).toBeGreaterThan(0);
});

test('login footer opens the existing terms and privacy screens', () => {
  const {renderer, navigation} = renderScreen(LoginScreen);
  const links = renderer.root.findAllByProps(
    {accessibilityRole: 'link'},
    {deep: false},
  );
  act(() => links[0].props.onPress());
  expect(navigation.navigate).toHaveBeenLastCalledWith('TermsConditions');
  act(() => links[1].props.onPress());
  expect(navigation.navigate).toHaveBeenLastCalledWith('PrivacyPolicy');
});

test('login sanitizes pasted input and carries the resend interval to verification', async () => {
  authService.requestOtp.mockResolvedValue({resendAfterSeconds: 45});
  const {renderer, navigation} = renderScreen(LoginScreen);
  act(() =>
    renderer.root
      .findByProps({testID: 'login-phone-input'})
      .props.onChangeText('98765-43210'),
  );
  await act(async () => {
    await renderer.root
      .findByProps({testID: 'login-request-otp'})
      .props.onPress();
  });
  expect(authService.requestOtp).toHaveBeenCalledWith('9876543210');
  expect(navigation.navigate).toHaveBeenCalledWith('OtpVerification', {
    phoneNumber: '9876543210',
    resendAfterSeconds: 45,
  });
});

test('login prevents duplicate OTP requests while the first request is pending', async () => {
  let resolveRequest;
  authService.requestOtp.mockImplementation(
    () =>
      new Promise(resolve => {
        resolveRequest = resolve;
      }),
  );
  const {renderer, navigation} = renderScreen(LoginScreen, {
    phoneNumber: '9876543210',
  });
  const submit = renderer.root.findByProps({testID: 'login-request-otp'}).props
    .onPress;
  let request;
  act(() => {
    request = submit();
  });
  expect(
    renderer.root.findByProps({testID: 'login-request-otp'}).props.disabled,
  ).toBe(true);
  expect(
    renderer.root.findByProps({testID: 'login-phone-input'}).props.editable,
  ).toBe(false);
  await act(async () => {
    await submit();
  });
  expect(authService.requestOtp).toHaveBeenCalledTimes(1);
  expect(navigation.navigate).not.toHaveBeenCalled();
  await act(async () => {
    resolveRequest({resendAfterSeconds: 60});
    await request;
  });
  expect(navigation.navigate).toHaveBeenCalledWith('OtpVerification', {
    phoneNumber: '9876543210',
    resendAfterSeconds: 60,
  });
});

test('login allows retrying after an OTP request fails', async () => {
  authService.requestOtp.mockRejectedValueOnce(
    new Error('Please try again later'),
  );
  const {renderer, navigation} = renderScreen(LoginScreen, {
    phoneNumber: '9876543210',
  });
  await act(async () => {
    await renderer.root
      .findByProps({testID: 'login-request-otp'})
      .props.onPress();
  });
  expect(navigation.navigate).not.toHaveBeenCalled();
  expect(
    renderer.root.findByProps({testID: 'login-request-otp'}).props.disabled,
  ).toBe(false);
  expect(
    renderer.root.findByProps({testID: 'login-phone-input'}).props.value,
  ).toBe('9876543210');
  authService.requestOtp.mockResolvedValueOnce({resendAfterSeconds: 60});
  await act(async () => {
    await renderer.root
      .findByProps({testID: 'login-request-otp'})
      .props.onPress();
  });
  expect(navigation.navigate).toHaveBeenCalledWith('OtpVerification', {
    phoneNumber: '9876543210',
    resendAfterSeconds: 60,
  });
});

test('the verification screen accepts pasted OTP and signs in using the server result', async () => {
  const session = {
    token: 'real-token',
    customerId: 42,
    mobileNumber: '9876543210',
  };
  authService.verifyOtp.mockResolvedValue(session);
  const {renderer, store} = renderScreen(OtpVerificationScreen, {
    phoneNumber: '9876543210',
    resendAfterSeconds: 60,
  });
  act(() =>
    renderer.root
      .findByProps({testID: 'otp-input'})
      .props.onChangeText('12 34'),
  );
  await act(async () => {
    await renderer.root.findByProps({testID: 'otp-continue'}).props.onPress();
  });
  expect(authService.verifyOtp).toHaveBeenCalledWith('9876543210', '1234');
  expect(store.getState().Auth).toMatchObject({...session, isLogged: true});
});

test('an OTP failure keeps the customer signed out and clears the rejected code', async () => {
  authService.verifyOtp.mockRejectedValue(new Error('Incorrect code'));
  const {renderer, store} = renderScreen(OtpVerificationScreen, {
    phoneNumber: '9876543210',
  });
  act(() =>
    renderer.root.findByProps({testID: 'otp-input'}).props.onChangeText('1234'),
  );
  await act(async () => {
    await renderer.root.findByProps({testID: 'otp-continue'}).props.onPress();
  });
  expect(store.getState().Auth.isLogged).toBe(false);
  expect(renderer.root.findByProps({testID: 'otp-input'}).props.value).toBe('');
});

test('OTP countdown displays the remaining server-provided interval', () => {
  const {renderer} = renderScreen(OtpVerificationScreen, {
    phoneNumber: '9876543210',
    resendAfterSeconds: 26,
  });
  expect(
    renderer.root.findByProps({testID: 'otp-resend'}).props.children.props
      .children,
  ).toBe('Resend OTP in 26');
});

test('resending remains disabled during the initial countdown', () => {
  const {renderer} = renderScreen(OtpVerificationScreen, {
    phoneNumber: '9876543210',
    resendAfterSeconds: 60,
  });
  expect(renderer.root.findByProps({testID: 'otp-resend'}).props.disabled).toBe(
    true,
  );
  expect(authService.requestOtp).not.toHaveBeenCalled();
});

test('OTP back returns to login with the entered number without authenticating', () => {
  const {renderer, navigation, store} = renderScreen(OtpVerificationScreen, {
    phoneNumber: '9876543210',
  });
  act(() => renderer.root.findByProps({testID: 'otp-back'}).props.onPress());
  expect(navigation.replace).toHaveBeenCalledWith('Login', {
    phoneNumber: '9876543210',
  });
  expect(store.getState().Auth.isLogged).toBe(false);
  expect(authService.verifyOtp).not.toHaveBeenCalled();
});

test('resend becomes available after the countdown and restarts using the server interval', async () => {
  jest.useFakeTimers();
  authService.requestOtp.mockResolvedValue({resendAfterSeconds: 45});
  const {renderer} = renderScreen(OtpVerificationScreen, {
    phoneNumber: '9876543210',
    resendAfterSeconds: 26,
  });
  act(() => jest.advanceTimersByTime(26000));
  expect(renderer.root.findByProps({testID: 'otp-resend'}).props.disabled).toBe(
    false,
  );
  act(() =>
    renderer.root.findByProps({testID: 'otp-input'}).props.onChangeText('12'),
  );
  await act(async () => {
    await renderer.root.findByProps({testID: 'otp-resend'}).props.onPress();
  });
  expect(authService.requestOtp).toHaveBeenCalledWith('9876543210');
  expect(renderer.root.findByProps({testID: 'otp-resend'}).props.disabled).toBe(
    true,
  );
  expect(renderer.root.findByProps({testID: 'otp-input'}).props.value).toBe('');
});
