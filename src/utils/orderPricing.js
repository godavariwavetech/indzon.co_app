// Some menu/customization responses include a separate base selling price.
// Standard menu items only provide selling_price.
export const getBaseSellingPrice = item => {
  const basePrice = Number(item.sellingprice);
  if (Number.isFinite(basePrice) && basePrice > 0) return basePrice;
  const sellingPrice = Number(item.selling_price);
  return Number.isFinite(sellingPrice) ? sellingPrice : 0;
};
