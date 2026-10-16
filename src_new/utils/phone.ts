// Adapted from multivendor_public_app/src/utils/phone.ts without Zod.
export const PHONE_NUMBER_LENGTH = 10;
export const PHONE_NUMBER_PATTERN = /^[6-9]\d{9}$/;

export const sanitizePhoneNumber = (value: string) => {
  let digits = value.replace(/\D/g, '');
  // Normalize complete autofilled/pasted numbers before limiting their length.
  // A ten-digit local number beginning with 91 must remain unchanged.
  if (digits.length === 14 && digits.startsWith('0091')) {
    digits = digits.slice(4);
  } else if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits.slice(0, PHONE_NUMBER_LENGTH);
};

export const isValidPhoneNumber = (value: string) =>
  PHONE_NUMBER_PATTERN.test(value);

export const maskPhoneNumber = (value: string) =>
  value.length <= 2
    ? value
    : `${value[0]}${'*'.repeat(value.length - 2)}${value[value.length - 1]}`;

export const sanitizeOtp = (value: string, length: number) =>
  value.replace(/\D/g, '').slice(0, length);
