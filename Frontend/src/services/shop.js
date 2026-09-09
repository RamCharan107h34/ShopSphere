import api from './api.js'

// ---- Cart ---------------------------------------------------------------
// All cart endpoints return the refreshed, populated cart as payload

export const fetchCart = async () => {
  const { data } = await api.get('/cart-api/cart')
  return data.payload
}

export const updateCartItem = async (itemId, quantity) => {
  const { data } = await api.put(`/cart-api/cart/${itemId}`, { quantity })
  return data.payload
}

export const removeCartItem = async (itemId) => {
  const { data } = await api.delete(`/cart-api/cart/${itemId}`)
  return data.payload
}

// ---- Coupons ---------------------------------------------------------------
// POST /coupon-api/validate  { code, orderAmount }
// payload: { code, discountType, discountValue, discount, finalAmount }
export const validateCoupon = async (code, orderAmount) => {
  const { data } = await api.post('/coupon-api/validate', { code, orderAmount })
  return data.payload
}

// ---- Orders ---------------------------------------------------------------
// POST /order-api/checkout  -> creates order, clears cart, returns order
export const placeOrder = async ({ shippingAddress, paymentMethod = 'COD', couponCode }) => {
  const { data } = await api.post('/order-api/checkout', {
    shippingAddress,
    paymentMethod,
    couponCode: couponCode || undefined,
  })
  return data.payload
}

export const fetchOrder = async (orderId) => {
  const { data } = await api.get(`/order-api/customer/orders/${orderId}`)
  return data.payload
}

// ---- Stores ---------------------------------------------------------------
// GET /seller-api/stores/:id is public
export const fetchStore = async (storeId) => {
  const { data } = await api.get(`/seller-api/stores/${storeId}`)
  return data.payload
}
