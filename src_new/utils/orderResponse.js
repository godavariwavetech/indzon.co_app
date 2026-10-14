// Placement responses may wrap the created order in `data`.
export const getCreatedOrder = response => {
  const data = response?.data ?? response;
  return Array.isArray(data) ? data[0] : data;
};

export const getOrderId = order => {
  const createdOrder = getCreatedOrder(order);
  return createdOrder?.id ?? createdOrder?.order_id;
};

// Order lookups can return either a list or a single order object.
export const getOrderRecords = response => {
  const data = response?.data ?? response;
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && (data.id != null || data.order_id != null)) {
    return [data];
  }
  return null;
};

export const findOrderInResponse = (response, requestedOrder) => {
  const orders = getOrderRecords(response);
  const requested = getCreatedOrder(requestedOrder);
  if (!orders || !requested) return undefined;
  const matches = (value, expected) => value != null && expected != null &&
    String(value) === String(expected);
  // Prefer the database ID; order_id may be the public order number.
  if (requested.id != null) {
    const match = orders.find(order => matches(order?.id, requested.id));
    if (match) return match;
  }
  const publicMatch = orders.find(order => matches(order?.order_id, requested.order_id));
  if (publicMatch) return publicMatch;
  // Some placement responses put the database ID in order_id instead of id.
  if (requested.id == null) {
    return orders.find(order => matches(order?.id, requested.order_id));
  }
  return undefined;
};

export const getPlacementOutcome = response => {
  if (!response || response.success === false || response.status === false ||
      Number(response.status) >= 400 ||
      ['error', 'failed', 'failure'].includes(String(response.status).toLowerCase())) {
    return 'failed';
  }
  if (getOrderId(response) || response.success === true ||
      response.status === true ||
      (Number(response.status) >= 200 && Number(response.status) < 300) ||
      response.status === 'success') {
    return 'success';
  }
  return 'unknown';
};

export const getPlacementErrorMessage = response => {
  const message = response?.message || response?.msg || response?.error?.message ||
    (typeof response?.error === 'string' ? response.error : undefined);
  if (typeof message === 'string' && message.trim()) return message;
  const status = response?.status;
  if (Number(status) === 400) {
    return 'Unable to place this order due to a timing issue. Please check the ordering time and try again.';
  }
  return `The server did not confirm this order${status != null ? ` (status: ${String(status)})` : ''}. Please check Your Orders before trying again.`;
};

export const getPlacementErrorTitle = response =>
  Number(response?.status) === 400 ? 'Timing Error' : 'Order Failed';
