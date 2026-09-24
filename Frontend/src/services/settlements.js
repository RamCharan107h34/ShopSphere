import api from './api.js'

// ---- Seller settlements (payout ledger) ------------------------------------

export const fetchSellerSettlements = async ({ page = 1, status } = {}) => {
  const { data } = await api.get('/settlement-api/seller/settlements', {
    params: { page, ...(status ? { status } : {}) },
  })
  return data.payload
}

export const fetchSellerSettlementSummary = async () => {
  const { data } = await api.get('/settlement-api/seller/settlements/summary')
  return data.payload
}

// ---- Admin settlement ledger ----------------------------------------------

export const fetchAdminSettlements = async ({ page = 1, status } = {}) => {
  const { data } = await api.get('/settlement-api/admin/settlements', {
    params: { page, ...(status ? { status } : {}) },
  })
  return data.payload
}

export const markSettlementPaid = async (settlementId, payoutReference) => {
  const { data } = await api.put(`/settlement-api/admin/settlements/${settlementId}/mark-paid`, {
    payoutReference,
  })
  return data.payload
}

// ---- Admin audit trail -----------------------------------------------------

export const fetchAuditLogs = async ({ page = 1, limit = 25, ...filters } = {}) => {
  const params = { page, limit }
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params[key] = value
  })

  const { data } = await api.get('/audit-api/admin/audit-logs', { params })
  return data.payload
}

export const fetchAuditActions = async () => {
  const { data } = await api.get('/audit-api/admin/audit-logs/actions')
  return data.payload
}
