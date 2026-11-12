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

// Order timestamps come from the backend as "YYYY-MM-DD hh:mm AM/PM" (12-hour,
// no seconds - see getorderlistMdl's DATE_FORMAT), which `new Date(...)` cannot
// parse in any JS engine, so it's picked apart by hand. "DD/MM/YYYY" (order_date,
// used when order_date_time is missing) is matched too.
const SERVER_DATETIME = /^(\d{4})-(\d{2})-(\d{2}) (\d{1,2}):(\d{2})\s*(AM|PM)$/i;
const SERVER_DATE = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const toDate = value => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'string') {
    const dateTime = value.match(SERVER_DATETIME);
    if (dateTime) {
      const [, year, month, day, hour12, minute, meridiem] = dateTime;
      const hour = (Number(hour12) % 12) + (meridiem.toUpperCase() === 'PM' ? 12 : 0);
      return new Date(Number(year), Number(month) - 1, Number(day), hour, Number(minute));
    }
    const dateOnly = value.match(SERVER_DATE);
    if (dateOnly) {
      const [, day, month, year] = dateOnly;
      return new Date(Number(year), Number(month) - 1, Number(day));
    }
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

// How long after it's placed an order is expected to arrive. Shown as a window
// (not a single instant) so a few minutes' real-world variance doesn't read as broken.
const DELIVERY_WINDOW_MINUTES = [45, 90];

export const estimatedDeliveryWindow = (placedAt, windowMinutes = DELIVERY_WINDOW_MINUTES) => {
  const base = toDate(placedAt);
  if (!base) {
    return '';
  }
  const [minMinutes, maxMinutes] = windowMinutes;
  const from = new Date(base.getTime() + minMinutes * 60000);
  const to = new Date(base.getTime() + maxMinutes * 60000);
  const time = date =>
    date.toLocaleTimeString('en-IN', {hour: 'numeric', minute: '2-digit'});
  const day = date =>
    date.toDateString() === new Date().toDateString()
      ? 'Today'
      : date.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        });
  return day(from) === day(to)
    ? `${day(to)}, ${time(from)} - ${time(to)}`
    : `${day(from)} ${time(from)} - ${day(to)} ${time(to)}`;
};
