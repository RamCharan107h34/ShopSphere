import exp from "express";

import { NotificationModel } from "../models/NotificationModel.js";
import { verifyToken } from "../middlewares/verifyToken.js";

export const notificationApp = exp.Router();

const pageParams = (query) => {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 50);
    return { page, limit, skip: (page - 1) * limit };
};

// 1. My notifications (paged, optional unread filter) + unread badge count.
// Unread is returned alongside the page so one request can paint the whole bell.
notificationApp.get("/notifications", verifyToken, async (req, res) => {
    const { page, limit, skip } = pageParams(req.query);

    const filter = { recipientId: req.user.id };
    if (req.query.unread === "true") filter.readAt = null;

    const [notifications, totalCount, unreadCount] = await Promise.all([
        NotificationModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        NotificationModel.countDocuments(filter),
        NotificationModel.countDocuments({ recipientId: req.user.id, readAt: null })
    ]);

    res.status(200).json({
        message: "Notifications fetched",
        payload: {
            notifications,
            unreadCount,
            totalCount,
            totalPages: Math.ceil(totalCount / limit) || 1,
            currentPage: page
        }
    });
});

// 2. Unread count only — the light endpoint the bell polls.
notificationApp.get("/notifications/unread-count", verifyToken, async (req, res) => {
    const unreadCount = await NotificationModel.countDocuments({
        recipientId: req.user.id,
        readAt: null
    });

    res.status(200).json({
        message: "Unread count",
        payload: { unreadCount }
    });
});

// 3. Mark every notification read
notificationApp.patch("/notifications/read-all", verifyToken, async (req, res) => {
    const result = await NotificationModel.updateMany(
        { recipientId: req.user.id, readAt: null },
        { $set: { readAt: new Date() } }
    );

    res.status(200).json({
        message: "All notifications marked read",
        payload: { updated: result.modifiedCount }
    });
});

// 4. Mark one read
notificationApp.patch("/notifications/:id/read", verifyToken, async (req, res) => {
    // Scoping the query by recipientId means one user can never touch another's
    // notifications — a wrong id simply 404s.
    const notification = await NotificationModel.findOneAndUpdate(
        { _id: req.params.id, recipientId: req.user.id },
        { $set: { readAt: new Date() } },
        { new: true }
    );

    if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({
        message: "Notification marked read",
        payload: notification
    });
});

// 5. Delete one
notificationApp.delete("/notifications/:id", verifyToken, async (req, res) => {
    const deleted = await NotificationModel.findOneAndDelete({
        _id: req.params.id,
        recipientId: req.user.id
    });

    if (!deleted) {
        return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({
        message: "Notification deleted",
        payload: deleted
    });
});
