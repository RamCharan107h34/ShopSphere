import api from './api.js'

// ---- Delivery partner ------------------------------------------------------

// GET /delivery-api/my-deliveries?status=...
export const fetchMyDeliveries = async (status) => {
  const { data } = await api.get('/delivery-api/my-deliveries', {
    params: status ? { status } : {},
  })
  return data.payload
}

// GET /delivery-api/deliveries/:id
export const fetchDeliveryById = async (deliveryId) => {
  const { data } = await api.get(`/delivery-api/deliveries/${deliveryId}`)
  return data.payload
}

// PUT /delivery-api/deliveries/:id/status  body: { status, note? }
export const updateDeliveryStatus = async (deliveryId, status) => {
  const { data } = await api.put(`/delivery-api/deliveries/${deliveryId}/status`, { status })
  return data.payload
}
