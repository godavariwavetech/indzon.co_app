import {appTheme} from './appTheme';
import {onboardingAssets} from '../assets';

export const OTP_LENGTH = 4;
export const DEFAULT_RESEND_SECONDS = 60;
export const ONBOARDING_STORAGE_KEY = 'amaraa-new-onboarding-complete';

export const authFlowColors = {
  primary: appTheme.primary /* Original: '#0096A1' */,
  background: '#FFFFFF',
  text: '#333333',
  muted: '#6B7280',
  border: '#CCCCCC',
  field: '#F9F9F9',
  danger: '#C62828',
};

export const onboardingSlides = [
  {
    id: 'food',
    image: onboardingAssets.food,
    imageLabel: 'Fresh food ready to order',
    title: 'Delicious choices,',
    emphasis: 'all in one place',
  },
  {
    id: 'grocery',
    image: onboardingAssets.grocery,
    imageLabel: 'Fresh groceries packed for delivery',
    title: 'Fresh essentials,',
    emphasis: 'delivered with care',
  },
  {
    id: 'delivery',
    image: onboardingAssets.delivery,
    imageLabel: 'Courier delivering an order by scooter',
    title: 'Fast delivery,',
    emphasis: 'right to your doorstep',
  },
];
