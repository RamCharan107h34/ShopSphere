// Indian-rupee display used across the storefront
export const formatPrice = (value) => {
  const amount = Number(value) || 0
  return `₹${amount.toLocaleString('en-IN')}`
}

// Discount % between original and current price, or null
export const discountPercent = (price, originalPrice) => {
  if (!originalPrice || originalPrice <= price || price <= 0) return null
  return Math.round((1 - price / originalPrice) * 100)
}
