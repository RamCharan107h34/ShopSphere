import api from './api.js'

// ---- Dashboard / Reports ------------------------------------------------
export const fetchAdminSummary = async () => {
  const { data } = await api.get('/analytics-api/admin/summary')
  return data.payload
}

// ---- Users ---------------------------------------------------------------
export const fetchUsers = async () => {
  const { data } = await api.get('/user-api/users')
  return data.payload
}

export const updateUser = async (userId, body) => {
  const { data } = await api.put(`/user-api/users/${userId}`, body)
  return data.payload
}

export const deleteUser = async (userId) => {
  const { data } = await api.delete(`/user-api/users/${userId}`)
  return data.payload
}

// ---- Seller applications ---------------------------------------------------
export const fetchApplications = async (status) => {
  const { data } = await api.get('/seller-api/admin/applications', { params: { status } })
  return data.payload
}

export const moderateStore = async (storeId, body) => {
  const { data } = await api.put(`/seller-api/admin/moderate/${storeId}`, body)
  return data.payload
}

// ---- Categories --------------------------------------------------------------
export const fetchAllCategories = async () => {
  const { data } = await api.get('/category-api/admin/categories')
  return data.payload
}

export const createCategory = async (body) => {
  const { data } = await api.post('/category-api/categories', body)
  return data.payload
}

export const updateCategory = async (categoryId, body) => {
  const { data } = await api.put(`/category-api/categories/${categoryId}`, body)
  return data.payload
}

export const deleteCategory = async (categoryId) => {
  const { data } = await api.delete(`/category-api/categories/${categoryId}`)
  return data.payload
}

// ---- Product moderation ------------------------------------------------------
export const fetchAllProducts = async (status) => {
  const { data } = await api.get('/product-api/admin/products', { params: { status } })
  return data.payload
}

export const moderateProduct = async (productId, status) => {
  const { data } = await api.put(`/product-api/admin/moderate/${productId}`, { status })
  return data.payload
}

// ---- Coupons ------------------------------------------------------------------
export const fetchCoupons = async () => {
  const { data } = await api.get('/coupon-api/coupons')
  return data.payload
}

export const createCoupon = async (body) => {
  const { data } = await api.post('/coupon-api/coupons', body)
  return data.payload
}

export const updateCoupon = async (couponId, body) => {
  const { data } = await api.put(`/coupon-api/coupons/${couponId}`, body)
  return data.payload
}

export const deleteCoupon = async (couponId) => {
  const { data } = await api.delete(`/coupon-api/coupons/${couponId}`)
  return data.payload
}

// ---- Disputes / support tickets ------------------------------------------------
export const fetchTickets = async (filters = {}) => {
  const { data } = await api.get('/support-api/tickets', { params: filters })
  return data.payload
}

export const fetchAgents = async () => {
  const { data } = await api.get('/support-api/agents')
  return data.payload
}

export const assignTicket = async (ticketId, supportAgentId) => {
  const { data } = await api.put(`/support-api/tickets/${ticketId}/assign`, { supportAgentId })
  return data.payload
}

export const updateTicketStatus = async (ticketId, body) => {
  const { data } = await api.put(`/support-api/tickets/${ticketId}/status`, body)
  return data.payload
}