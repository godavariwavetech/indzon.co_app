/**
 * Sign-in (Login) screen design spec.
 *
 * Every measurement is in dp on the 360 × 780 design frame and is multiplied
 * by `screenWidth / LOGIN_DESIGN_WIDTH` at runtime, so the screen keeps the
 * reference proportions on every device. Vertical values are top offsets on
 * that frame; the space between the phone field and the Request OTP button
 * absorbs any difference in screen height.
 */

export const LOGIN_DESIGN_WIDTH = 360;
export const LOGIN_DESIGN_HEIGHT = 780;

export const loginColors = {
  brand: '#0096A1',
  title: '#0096A1',
  subtitle: '#6B7280',
  label: '#333333',
  inputText: '#333333',
  inputBorder: '#CCCCCC',
  inputBackground: '#FFFFFF',
  background: '#FFFFFF',
  cardShadow: '#000000',
} as const;

export const loginLayout = {
  /** Logo artwork frame (see BrandLogo). */
  logoTop: 88,
  logoLeft: 57,
  logoWidth: 237,
  logoHeight: 55,

  /** Card header canvas: hump outline, its shadow and the shield badge. */
  cardCanvasTop: 170,
  cardCanvasHeight: 103.3,
  cardTop: 240,
  cardCornerRadius: 20,
  humpRadius: 52,
  humpFilletRadius: 16,
  badgeCenterY: 237,
  badgeRadius: 26,
  badgeIconSize: 32,

  titleFontSize: 26,
  titleLineHeight: 32,
  subtitleGap: 1,
  subtitleFontSize: 14,
  subtitleLineHeight: 20,

  horizontalPadding: 24,
  labelGap: 24.2,
  labelFontSize: 16,
  labelLineHeight: 22,
  inputGap: 5.6,
  inputHeight: 52,
  inputRadius: 8,
  inputPaddingHorizontal: 14,
  inputFontSize: 16,

  /**
   * The phone field → button gap (225 on the design frame) is flexible; it
   * never shrinks below this.
   */
  minFormToButtonGap: 24,
  buttonHeight: 40,
  buttonRadius: 6,
  buttonFontSize: 14,
  buttonBottom: 85,
} as const;

/** Indian mobile numbers: 10 digits starting with 6–9. */
export const PHONE_NUMBER_LENGTH = 10;
export const PHONE_NUMBER_PATTERN = /^[6-9]\d{9}$/;
