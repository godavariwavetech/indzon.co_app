// Placement responses may wrap the created order in `data`.
export const getCreatedOrder = response => {
  const data = response?.data ?? response;
  return Array.isArray(data) ? data[0] : data;
};

export const getOrderId = order => {
  const createdOrder = getCreatedOrder(order);
  return createdOrder?.id ?? createdOrder?.order_id;
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
  return `The server did not confirm this order${status != null ? ` (status: ${String(status)})` : ''}. Please check Your Orders before trying again.`;
};
