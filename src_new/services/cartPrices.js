// A changed price requires another confirmation; never place from a stale snapshot.
export async function verifyCartPrices({ids, previous, locationId, refresh}) {
  const latest = await refresh(ids, locationId);
  if (ids.some(id => !latest[id])) {
    throw new Error('Some cart items could not be verified. Your items are saved; please try again.');
  }
  const changed = ids.some(id => !previous[id] ||
    ['price', 'originalPrice', 'gstPercent', 'shopId'].some(
      field => previous[id][field] !== latest[id][field],
    ));
  if (changed) {
    throw new Error('Product prices have changed. Please review the updated cart total and place your order again.');
  }
}
