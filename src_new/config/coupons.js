// Offers for the local commerce preview.
export const coupons = [
  {
    code: 'MEALUP50',
    label: 'FLAT',
    badge: '50 %',
    title: 'Get 50% OFF',
    caption: 'up to 100 on your order',
    action: 'Apply',
    percent: 50,
    cap: 100,
  },
  {
    code: 'HEALTHY20',
    label: '',
    badge: '20 %',
    title: 'Get 20% OFF',
    caption: 'on all healthy options',
    action: 'Use Code',
    percent: 20,
    categories: ['produce'],
  },
  {
    code: 'SNACK15',
    label: 'FLAT',
    badge: '15%',
    title: 'Get 15% OFF',
    caption: 'with purchase of 5 items',
    action: 'Claim Now',
    percent: 15,
    minItems: 5,
  },
  {
    code: 'SUMMER25',
    label: 'FLAT',
    badge: '₹89',
    title: 'Flat ₹89 OFF',
    caption: 'for summer specials',
    action: 'Apply Today',
    flat: 89,
  },
  {
    code: 'FIRSTORDER20',
    label: 'FIRSTORDER',
    badge: '20 %',
    title: '20% OFF your first order',
    caption: 'Join us today!',
    action: 'Sign Up',
    percent: 20,
    firstOrder: true,
  },
  {
    code: 'MEALPLAN40',
    label: 'MEALPLAN',
    badge: '40 %',
    title: 'Get 40% OFF',
    caption: 'up to 100 on your order',
    action: 'Apply',
    percent: 40,
    cap: 100,
  },
];

export function evaluateCoupon(code, items, orders = []) {
  const offer = coupons.find(
    item =>
      item.code ===
      String(code || '')
        .trim()
        .toUpperCase(),
  );
  if (!offer) {
    return {discount: 0, error: 'Enter a valid coupon code.'};
  }
  if (!items.length) {
    return {
      discount: 0,
      error: 'Add items to your cart before applying a coupon.',
    };
  }
  if (offer.firstOrder && orders.length) {
    return {
      discount: 0,
      error: 'This coupon is only available on your first order.',
    };
  }
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  if (offer.minItems && count < offer.minItems) {
    return {
      discount: 0,
      error: `Add ${offer.minItems - count} more item(s) to use this coupon.`,
    };
  }
  const eligible = items.filter(
    item => !offer.categories || offer.categories.includes(item.categoryId),
  );
  const amount = eligible.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  if (!amount) {
    return {
      discount: 0,
      error:
        'This coupon applies to fruits and vegetables. Add eligible items to your cart.',
    };
  }
  const discount = Math.min(
    amount,
    offer.cap ?? Infinity,
    offer.flat ?? (amount * offer.percent) / 100,
  );
  return {
    discount: Math.round(discount * 100) / 100,
    error: null,
    code: offer.code,
  };
}
