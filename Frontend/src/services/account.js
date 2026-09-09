import api from './api.js'

// ---- Profile -------------------------------------------------------------
export const fetchProfile = async () => {
  const { data } = await api.get('/user-api/profile')
  return data.payload
}

export const updateProfile = async ({ name, phone, address }) => {
  const { data } = await api.put('/user-api/profile', {
    name,
    phone,
    ...(address ? { address } : {}),
  })
  return data.payload
}

// ---- Wishlist -------------------------------------------------------------
export const fetchWishlist = async () => {
  const { data } = await api.get('/wishlist-api/wishlist')
  return data.payload.products || []
}

// ---- Orders ---------------------------------------------------------------
export const fetchMyOrders = async () => {
  const { data } = await api.get('/order-api/customer/my-orders')
  return data.payload
}

export const cancelMyOrder = async (orderId) => {
  const { data } = await api.put(`/order-api/customer/orders/${orderId}/cancel`)
  return data.payload
}

// ---- Reviews ----------------------------------------------------------------
export const submitReview = async ({ orderId, productId, rating, comment }) => {
  const { data } = await api.post(`/review-api/products/${productId}`, { orderId, rating, comment })
  return data.payload
}

// ---- Returns ---------------------------------------------------------------
export const fetchMyReturns = async () => {
  const { data } = await api.get('/return-api/customer/my-returns')
  return data.payload
}

// body: { orderId, subOrderId, productId, quantity, reason, description }
export const requestReturn = async (body) => {
  const { data } = await api.post('/return-api/request', body)
  return data.payload
}
