// Shared display helpers. All catalog data (categories, shops, items, banners,
// coupons, orders) comes from the backend via services/catalogService.js.
const categoryIcon = (source, resizeMode = 'contain') => ({
  source,
  background: require('../assets/main/references/category-background.png'),
  resizeMode,
});

// The "More" tile on the home/search category grids is UI chrome, not data.
export const moreArtwork = categoryIcon(
  require('../assets/main/references/more.png'),
);

export const money = amount => `₹${Number(amount).toLocaleString('en-IN')}`;
