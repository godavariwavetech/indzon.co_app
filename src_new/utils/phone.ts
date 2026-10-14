// Adapted from multivendor_public_app/src/utils/phone.ts without Zod.
export const PHONE_NUMBER_LENGTH = 10;
export const PHONE_NUMBER_PATTERN = /^[6-9]\d{9}$/;

export const sanitizePhoneNumber = (value: string) =>
  value.replace(/\D/g, '').slice(0, PHONE_NUMBER_LENGTH);

export const isValidPhoneNumber = (value: string) =>
  PHONE_NUMBER_PATTERN.test(value);

export const maskPhoneNumber = (value: string) =>
  value.length <= 2
    ? value
    : `${value[0]}${'*'.repeat(value.length - 2)}${value[value.length - 1]}`;

export const sanitizeOtp = (value: string, length: number) =>
  value.replace(/\D/g, '').slice(0, length);
