import { NotificationModel } from "../models/NotificationModel.js";

// Create one in-app notification.
//
// Deliberately non-throwing: a notification is a side effect, and a failure to
// deliver one must not roll back the order/return/ticket change that caused it.
export const notify = async ({
    recipientId,
    type = "system",
    title,
    message = "",
    link = "",
    entityId = null
} = {}) => {
    try {
        if (!recipientId || !title) return null;
        return await NotificationModel.create({
            recipientId,
            type,
            title,
            message,
            link,
            entityId: entityId || null
        });
    } catch (error) {
        console.error("Notification write failed:", error.message);
        return null;
    }
};

// Fan a single event out to several recipients (deduplicated).
export const notifyMany = async (recipientIds = [], payload = {}) => {
    const unique = [...new Set(recipientIds.filter(Boolean).map(String))];
    return Promise.all(unique.map((recipientId) => notify({ ...payload, recipientId })));
};

// Fan a single event out to every admin (e.g. a new seller application).
export const notifyAdmins = async (adminIds = [], payload = {}) =>
    notifyMany(adminIds, payload);
