import api from '../utils/api';
import {endpoints} from '../config/config';
import {DEFAULT_RESEND_SECONDS, OTP_LENGTH} from '../config/authFlow';
import {isValidPhoneNumber} from '../utils/phone';

const requireSuccess = response => {
  const body = response?.data;
  const status = body?.status;
  if (
    !body ||
    body.success === false ||
    (status != null && ![true, 200, '200', 'success'].includes(status))
  ) {
    throw new Error(body?.message || 'The request failed. Please try again.');
  }
  return body;
};

const requestOtp = async phoneNumber => {
  if (!isValidPhoneNumber(phoneNumber)) {
    throw new Error('Enter a valid 10-digit mobile number.');
  }
  let response;
  try {
    response = await api.post(
      endpoints.REQUEST_OTP,
      {customer_mobile_number: phoneNumber},
      // Allow the backend's 15-second SMS gateway timeout to finish.
      {timeout: 20000},
    );
  } catch (error) {
    if (error.response?.status >= 500) {
      throw new Error(
        'The OTP service is temporarily unavailable. Please try again later.',
      );
    }
    throw error;
  }
  const body = requireSuccess(response);
  const seconds = Number(body.resendAfterSeconds ?? body.resend_after_seconds);
  return {
    resendAfterSeconds:
      Number.isFinite(seconds) && seconds > 0
        ? Math.ceil(seconds)
        : DEFAULT_RESEND_SECONDS,
  };
};

const verifyOtp = async (phoneNumber, otp) => {
  if (
    !isValidPhoneNumber(phoneNumber) ||
    !new RegExp(`^\\d{${OTP_LENGTH}}$`).test(otp)
  ) {
    throw new Error(`Enter the ${OTP_LENGTH}-digit verification code.`);
  }
  const body = requireSuccess(
    await api.post(endpoints.VERIFY_CUSTOMER_OTP, {
      customer_mobile_number: phoneNumber,
      customer_otp: otp,
    }),
  );
  const customer = Array.isArray(body.data) ? body.data[0] : body.data;
  const token = body.token || body.accessToken || customer?.token || null;
  const customerId = customer?.customer_id ?? body.customer_id ?? null;
  if (!token && !customerId) {
    throw new Error(
      body.message || 'Could not verify this code. Please try again.',
    );
  }
  return {
    token,
    customerId,
    customerName: (customer?.customer_name || '').trim(),
    mobileNumber: phoneNumber,
  };
};

export default {requestOtp, verifyOtp};
