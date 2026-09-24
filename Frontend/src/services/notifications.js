import api from './api.js'

// ---- In-app notifications -------------------------------------------------
// The bell polls `fetchUnreadCount` (a single countDocuments) and only loads the
// full list when the panel is opened, so an idle page costs one tiny request.

export const fetchUnreadCount = async () => {
  const { data } = await api.get('/notification-api/notifications/unread-count')
  return data.payload.unreadCount || 0
}

export const fetchNotifications = async ({ page = 1, limit = 20, unreadOnly = false } = {}) => {
  const { data } = await api.get('/notification-api/notifications', {
    params: { page, limit, ...(unreadOnly ? { unread: true } : {}) },
  })
  return data.payload
}

export const markNotificationRead = async (notificationId) => {
  const { data } = await api.patch(`/notification-api/notifications/${notificationId}/read`)
  return data.payload
}

export const markAllNotificationsRead = async () => {
  const { data } = await api.patch('/notification-api/notifications/read-all')
  return data.payload
}

export const deleteNotification = async (notificationId) => {
  const { data } = await api.delete(`/notification-api/notifications/${notificationId}`)
  return data.payload
}
