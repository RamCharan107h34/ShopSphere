import api from './api.js'

export const fetchTickets = async (filters = {}) => {
  const { data } = await api.get('/support-api/tickets', { params: filters })
  return data.payload
}

export const fetchTicket = async (ticketId) => {
  const { data } = await api.get(`/support-api/tickets/${ticketId}`)
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

export const replyOnTicket = async (ticketId, message) => {
  const { data } = await api.post(`/support-api/tickets/${ticketId}/replies`, { message })
  return data.payload
}