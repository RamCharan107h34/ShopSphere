import api from './api.js'

// ---- Catalog read endpoints (public) ---------------------------------

export const fetchCategories = async () => {
  const { data } = await api.get('/category-api/categories')
  return data.payload
}

// params: { search, category, minPrice, maxPrice, inStock, sort, page, limit }
export const fetchProducts = async (params = {}) => {
  const { data } = await api.get('/product-api/products', { params })
  return data.payload // { products, totalCount, totalPages, currentPage }
}

export const fetchTopPicks = async (limit = 8) => {
  const { data } = await api.get('/product-api/top-picks', { params: { limit } })
  return data.payload.topPicks.map((pick) => pick.product)
}

// ---- Customer actions (authenticated) ---------------------------------

export const addToCart = (productId, quantity = 1, variantId) =>
  api.post('/cart-api/cart', { productId, quantity, variantId })

export const addToWishlist = (productId) => api.post(`/wishlist-api/wishlist/${productId}`)
export const removeFromWishlist = (productId) => api.delete(`/wishlist-api/wishlist/${productId}`)

// ---- AI semantic search ----------------------------------------------------

// POST /ai-api/search — natural-language product search.
// The backend keyword-prefilters, then re-ranks candidates with Cohere and
// returns { mode: 'semantic' | 'keyword', query, products }.
// Products carry an extra `relevanceScore` (0..1) and `rank` in semantic mode.
export const aiSearchProducts = async ({ query, limit = 25 }) => {
  const { data } = await api.post('/ai-api/search', { query, limit })
  return data.payload // { mode, query, products }
}
