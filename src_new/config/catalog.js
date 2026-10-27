// Shared display helpers. All catalog data (categories, shops, items, banners,
// coupons, orders) comes from the backend via services/catalogService.js.
const categoryIcon = (source, resizeMode = 'contain') => ({
  source,
  background: require('../assets/main/references/category-background.png'),
  resizeMode,
});

// The "More" tile on the home/search category grids uses a bundled picture (not a
// backend image), so it always renders.
export const moreArtwork = categoryIcon(
  require('../assets/main/references/more.png'),
);

// Whole rupees print plain; anything with paise always shows two decimals (₹8.10, not ₹8.1).
export const money = amount => {
  const value = Math.round((Number(amount) || 0) * 100) / 100;
  return `₹${value.toLocaleString('en-IN', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
};

// Item prices already include GST, so the GST inside a price is
// price x rate / (100 + rate), never price x rate / 100.
export const includedGst = (amount, percent) => {
  const rate = Number(percent) || 0;
  return rate > 0
    ? Math.round(((Number(amount) || 0) * rate * 100) / (100 + rate)) / 100
    : 0;
};
