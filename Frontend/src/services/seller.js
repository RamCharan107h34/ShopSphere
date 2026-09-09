import api from './api.js'

// ---- Store ----------------------------------------------------------------
export const fetchMyStore = async () => {
  const { data } = await api.get('/seller-api/my-store')
  return data.payload // { store, sellerDetails }
}

export const updateMyStore = async (body) => {
  const { data } = await api.put('/seller-api/my-store', body)
  return data.payload
}

// ---- Products ---------------------------------------------------------------
export const fetchMyProducts = async () => {
  const { data } = await api.get('/product-api/seller/my-products')
  return data.payload
}

export const fetchLowStock = async () => {
  const { data } = await api.get('/product-api/seller/low-stock')
  return data.payload
}

export const createProduct = async (body) => {
  const { data } = await api.post('/product-api/products', body)
  return data.payload
}

export const updateProduct = async (productId, body) => {
  const { data } = await api.put(`/product-api/products/${productId}`, body)
  return data.payload
}

export const deleteProduct = async (productId) => {
  const { data } = await api.delete(`/product-api/products/${productId}`)
  return data.payload
}

// body: { stock?, lowStockThreshold?, variantId? }
export const updateStock = async (productId, body) => {
  const { data } = await api.put(`/product-api/products/${productId}/stock`, body)
  return data.payload
}

// ---- Orders (this seller's vendor sub-orders) ------------------------------
export const fetchSellerOrders = async () => {
  const { data } = await api.get('/order-api/seller/orders')
  return data.payload
}

export const updateSubOrderStatus = async (orderId, subOrderId, { status, trackingNumber }) => {
  const { data } = await api.put(
    `/order-api/seller/orders/${orderId}/sub-orders/${subOrderId}/status`,
    { status, trackingNumber },
  )
  return data.payload
}

// ---- Returns -----------------------------------------------------------------
export const fetchSellerReturns = async () => {
  const { data } = await api.get('/return-api/seller/returns')
  return data.payload
}

export const updateReturnStatus = async (returnId, { status, adminNote }) => {
  const { data } = await api.put(`/return-api/seller/returns/${returnId}/status`, { status, adminNote })
  return data.payload
}

// ---- AI product copy -------------------------------------------------------------
export const generateDescription = async (body) => {
  const { data } = await api.post('/ai-api/generate-description', body)
  return data.payload // { description, sellingPoints }
}

// ---- Analytics -----------------------------------------------------------------
export const fetchSellerSummary = async () => {
  const { data } = await api.get('/analytics-api/seller/summary')
  return data.payload
}
