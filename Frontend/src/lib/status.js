// Shared presentation metadata + step builders for order and return statuses.

// Full customer-visible journey. Sellers advance placed → confirmed → packed;
// the delivery partner then marks shipped → out for delivery → delivered.
export const VENDOR_FLOW = ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered']

// Overall order badge (OrderModel.overallStatus)
export const ORDER_META = {
  placed: { label: 'Placed', variant: 'neutral' },
  processing: { label: 'Processing', variant: 'default' },
  shipped: { label: 'Shipped', variant: 'default' },
  delivered: { label: 'Delivered', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'danger' },
}

// Vendor sub-order badge (vendorSubOrder.status)
export const SUBORDER_META = {
  placed: { label: 'Placed', variant: 'neutral' },
  confirmed: { label: 'Confirmed', variant: 'default' },
  packed: { label: 'Packed', variant: 'secondary' },
  shipped: { label: 'Shipped', variant: 'default' },
  out_for_delivery: { label: 'Out for delivery', variant: 'warning' },
  delivered: { label: 'Delivered', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'danger' },
  return_requested: { label: 'Return requested', variant: 'warning' },
  returned: { label: 'Returned', variant: 'danger' },
  refunded: { label: 'Refunded', variant: 'success' },
}

// Support ticket status badge (SupportModel.status)
export const TICKET_STATUS_META = {
  open: { label: 'Open', variant: 'warning' },
  in_progress: { label: 'In progress', variant: 'default' },
  resolved: { label: 'Resolved', variant: 'success' },
  closed: { label: 'Closed', variant: 'neutral' },
}

// Support ticket category badge
export const TICKET_CATEGORY_META = {
  dispute: { label: 'Dispute', variant: 'danger' },
  order_issue: { label: 'Order issue', variant: 'warning' },
  refund: { label: 'Refund', variant: 'secondary' },
  general: { label: 'General', variant: 'neutral' },
}

// Support ticket priority badge
export const TICKET_PRIORITY_META = {
  low: { label: 'Low', variant: 'neutral' },
  medium: { label: 'Medium', variant: 'warning' },
  high: { label: 'High', variant: 'danger' },
}

// Return request badge (ReturnModel.status)
export const RETURN_META = {
  requested: { label: 'Requested', variant: 'warning' },
  approved: { label: 'Approved', variant: 'default' },
  rejected: { label: 'Rejected', variant: 'danger' },
  completed: { label: 'Refunded', variant: 'success' },
}

export const RETURN_REASONS = [
  'Defective / Damaged item',
  'Wrong item delivered',
  'Item not as described',
  'Changed mind',
  'Other',
]

export const statusMetaOf = (status, meta) => {
  const found = meta?.[status]
  return found || { label: status || '—', variant: 'neutral' }
}

// Progress steps for the standard vendor flow (accurate because the current
// status is the furthest stage reached). Non-flow statuses return [].
// step.state is one of 'done' | 'current' | 'idle'
export const vendorFlowSteps = (status) => {
  const index = VENDOR_FLOW.indexOf(status)
  if (index < 0) return []
  return VENDOR_FLOW.map((key, i) => ({
    key,
    label: statusMetaOf(key, SUBORDER_META).label,
    state: i < index ? 'done' : i === index ? 'current' : 'idle',
  }))
}

// Steps for a return request lifecycle.
export const returnFlowSteps = (status) => {
  if (status === 'rejected') {
    return [
      { key: 'requested', label: 'Requested', state: 'done' },
      { key: 'rejected', label: 'Rejected by seller', state: 'current' },
    ]
  }
  const sequence = ['requested', 'approved', 'completed']
  const index = sequence.indexOf(status)
  if (index < 0) return []
  return sequence.map((key, i) => ({
    key,
    label: statusMetaOf(key, RETURN_META).label,
    state: i < index ? 'done' : i === index ? 'current' : 'idle',
  }))
}

// Shipment status badge (DeliveryModel.status). The delivery partner picks the
// package up from the seller (→ Shipped), takes it out for delivery, then delivers.
export const DELIVERY_META = {
  assigned: { label: 'Assigned', variant: 'neutral' },
  shipped: { label: 'Shipped', variant: 'default' },
  out_for_delivery: { label: 'Out for delivery', variant: 'warning' },
  delivered: { label: 'Delivered', variant: 'success' },
}

// Steps for a delivery partner's shipment lifecycle.
export const deliveryFlowSteps = (status) => {
  const sequence = ['assigned', 'shipped', 'out_for_delivery', 'delivered']
  const index = sequence.indexOf(status)
  if (index < 0) return []
  return sequence.map((key, i) => ({
    key,
    label: statusMetaOf(key, DELIVERY_META).label,
    state: i < index ? 'done' : i === index ? 'current' : 'idle',
  }))
}

// The next status a delivery partner can advance a shipment to, or null
export const nextDeliveryStatus = (status) => {
  const next = { assigned: 'shipped', shipped: 'out_for_delivery', out_for_delivery: 'delivered' }
  return next[status] || null
}

// True when the customer may still cancel the whole order
export const canCancelOrder = (order) => {
  return !order || ['placed', 'processing'].includes(order.overallStatus)
}
